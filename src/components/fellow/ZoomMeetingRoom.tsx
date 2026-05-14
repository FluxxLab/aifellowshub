"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";

type SignatureResponse = {
  signature: string;
  sdkKey: string;
  meetingNumber: string;
  role: number;
  sessionTitle: string;
  meetingPassword?: string;
  /**
   * Host token (Zoom Access Key). Backend mints one for admins/faculty
   * who own the course; empty string for participants. Required by the
   * Meeting SDK alongside `role: 1` to actually start the meeting on
   * Zoom's side. The SDK ignores this field when role is 0.
   */
  zak?: string;
};

/**
 * Embeds a Zoom meeting inline (Meeting SDK Component View, BRD §6.4).
 *
 * Loads the SDK lazily so the heavy WASM bundle never ships on
 * non-meeting pages. The Component View renders into the `<div>` we
 * mount via `containerRef`, leaving the LMS sidebar/header visible.
 *
 * Stack constraints:
 *   - Next 14 + React 18.2.0 — Component View's internal `__SECRET_
 *     INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner`
 *     access requires React 18.2 exactly. React 18.3+ broke the
 *     property layout, and Next 15+ requires React 18.3+ (uses
 *     `React.cache()` internally), so the inline embed only works on
 *     this older trio. Don't bump Next without re-verifying.
 *
 * Cross-origin isolation (COOP `same-origin` + COEP `require-corp`)
 * is required for the WASM SharedArrayBuffer path — see next.config.
 *
 * Cleanup is critical — `destroyClient()` MUST run on unmount or the
 * next mount will fail with "client is already initialised".
 */
export default function ZoomMeetingRoom({
  sessionId,
  onLeave,
  startFullscreen = false,
}: {
  sessionId: string;
  onLeave?: () => void;
  /**
   * Open the meeting in fullscreen on mount. Used by the admin
   * session-preview flow so previews get the full viewport
   * automatically instead of opening as a small inline card the
   * user has to expand manually.
   */
  startFullscreen?: boolean;
}) {
  const user = useCurrentUser();
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<unknown>(null);
  const [phase, setPhase] = useState<
    "loading" | "joining" | "in-meeting" | "left" | "error"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const router = useRouter();
  const { confirm, dialog } = useConfirm();

  // Sync our local flag with the browser's Fullscreen API so the
  // overlay state stays consistent when the user exits via Esc, the
  // browser's own fullscreen control, or the OS gesture.
  useEffect(() => {
    const onChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs) {
        try {
          (screen.orientation as ScreenOrientation & { unlock?: () => void })
            .unlock?.();
        } catch {
          // Best-effort — Safari / older Android throw or no-op.
        }
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  // CSS-only fallback path (Fullscreen API unsupported / denied) — Esc
  // still has to work and the body must not scroll behind the overlay.
  useEffect(() => {
    if (!isFullscreen) return;
    if (document.fullscreenElement) return; // browser handles Esc itself
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isFullscreen]);

  async function enterFullscreen() {
    const el = wrapperRef.current;
    if (!el) return;
    const apiEl = el as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    let inApi = false;
    try {
      if (apiEl.requestFullscreen) {
        await apiEl.requestFullscreen();
        inApi = true;
      } else if (apiEl.webkitRequestFullscreen) {
        await apiEl.webkitRequestFullscreen();
        inApi = true;
      }
    } catch {
      // User denied, no permission, or unsupported — fall through to
      // the CSS overlay below.
    }
    if (inApi) {
      // Mobile: rotate to landscape so the Zoom tile uses the long
      // edge. Orientation.lock requires being in fullscreen first
      // (browser-enforced), so this can only run after the API call
      // resolves. iOS Safari rejects — that's expected; the user
      // rotates the device by hand.
      const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
      if (isCoarsePointer) {
        try {
          const orientation = screen.orientation as ScreenOrientation & {
            lock?: (o: string) => Promise<void>;
          };
          await orientation.lock?.("landscape");
        } catch {
          // Silently ignore — user can rotate manually.
        }
      }
    } else {
      setIsFullscreen(true);
    }
  }

  async function exitFullscreen() {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    if (document.fullscreenElement || doc.webkitExitFullscreen) {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          return;
        }
        if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
          return;
        }
      } catch {
        // Fall through to manual state flip.
      }
    }
    setIsFullscreen(false);
  }

  // Honour the startFullscreen prop on mount. requestFullscreen requires
  // a user gesture; the parent component invokes us synchronously from
  // a click, so most browsers still accept it. If they don't, the CSS
  // overlay kicks in via the catch path inside enterFullscreen.
  useEffect(() => {
    if (!startFullscreen) return;
    void enterFullscreen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the wrapper grows (entering fullscreen / window resize) ask
  // the embedded video tile to redraw at the new size. Without this
  // the Zoom embed stays pinned to whatever viewSizes.default it got
  // at init, leaving a tiny meeting inside a huge black wrapper.
  //
  // Debounced — ResizeObserver fires 10+ times during a fullscreen
  // transition, and an undebounced updateVideoOptions on every tick
  // makes the SDK thrash (video tiles flicker, audio briefly drops,
  // and on slow networks the meeting reconnects). 150ms is enough to
  // coalesce a transition without feeling laggy.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const apply = () => {
      const client = clientRef.current as
        | {
            updateVideoOptions?: (o: {
              viewSizes?: { default?: { width: number; height: number } };
            }) => void;
          }
        | null;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      try {
        client?.updateVideoOptions?.({
          viewSizes: {
            default: {
              width: Math.round(rect.width),
              height: Math.round(rect.height),
            },
          },
        });
      } catch {
        // SDK may not yet expose updateVideoOptions; ignored.
      }
    };
    const obs = new ResizeObserver(() => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(apply, 150);
    });
    obs.observe(el);
    return () => {
      if (timeout) clearTimeout(timeout);
      obs.disconnect();
    };
  }, [phase]);

  // Hold the latest user in a ref so start() can read the real name
  // without forcing the SDK to re-init each time the user object's
  // identity changes (useCurrentUser swaps the reference on every
  // refresh / refetch even when the underlying name/email stay put).
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    async function start() {
      try {
        const sigRes = await fetch(
          `/api/sessions/${encodeURIComponent(sessionId)}/zoom-signature`,
          { credentials: "include" },
        );
        if (!sigRes.ok) {
          const body = (await sigRes.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(
            body.message ?? `Couldn't mint signature (${sigRes.status})`,
          );
        }
        const sig = (await sigRes.json()) as SignatureResponse;
        if (cancelled) return;
        // Backend returns role=1 only for users it considers a host
        // (admin / faculty owner). Drives whether the End-session
        // control is rendered.
        setIsHost(sig.role === 1);

        const mod = await import("@zoom/meetingsdk/embedded");
        if (cancelled) return;
        const ZoomMtgEmbedded = mod.default;
        const client = ZoomMtgEmbedded.createClient();
        clientRef.current = client;

        if (!containerRef.current) {
          throw new Error("Meeting container missing.");
        }

        // The SDK defaults to a fixed ~600x400 render size when no
        // viewSizes are passed, which is why the meeting tile looks
        // tiny inside our larger wrapper. Measure the container at
        // init time and tell the SDK to fill it. `isResizable: true`
        // lets the SDK re-layout when we toggle fullscreen.
        const rect = containerRef.current.getBoundingClientRect();
        const containerWidth =
          Math.max(rect.width, window.innerWidth) || window.innerWidth;
        const containerHeight =
          Math.max(rect.height, window.innerHeight) || window.innerHeight;

        await client.init({
          zoomAppRoot: containerRef.current,
          language: "en-US",
          patchJsMedia: true,
          leaveOnPageUnload: true,
          customize: {
            video: {
              isResizable: true,
              // Intentionally NO defaultViewType. Setting `speaker` made
              // the tile fill the container but hid Zoom's bottom toolbar
              // (mic / camera / share / leave) — fellows lost every
              // control. Leaving it unset lands on the SDK's standard
              // view (active speaker + toolbar). Size is driven by
              // viewSizes.default below, which is what makes the embed
              // fill the wrapper.
              viewSizes: {
                default: {
                  width: Math.round(containerWidth),
                  height: Math.round(containerHeight),
                },
                ribbon: {
                  width: 300,
                  height: Math.round(containerHeight),
                },
              },
            },
          },
        });
        if (cancelled) return;

        setPhase("joining");
        // Note: `sdkKey` is intentionally NOT passed in joinOptions —
        // it was removed from the JoinOptions interface in SDK v4.0.0.
        // The signature JWT already carries the key (we sign with
        // `sdkKey` + `appKey` in the payload), so passing it here just
        // logs a deprecation warning to console without doing anything.
        //
        // `customerKey` is the dedup key Zoom uses to recognise the
        // same user across rejoins. When a fellow's previous session
        // didn't shut down cleanly (network blip, closed tab, browser
        // crash) the ghost participant lingers in the roster until
        // Zoom's timeout. Sending the LMS user id as customerKey on
        // every join tells Zoom "boot the previous session for this
        // user — this one is the new authoritative one."
        const currentUser = userRef.current;
        await client.join({
          signature: sig.signature,
          meetingNumber: sig.meetingNumber,
          userName: currentUser?.fullName ?? "PIC LMS Fellow",
          userEmail: currentUser?.email ?? "",
          password: sig.meetingPassword ?? "",
          customerKey: currentUser?.id ?? currentUser?.email ?? undefined,
          // ZAK promotes the joiner to host on Zoom's side. Without it
          // an admin signing in with role=1 would hang at "Connecting".
          // Backend only returns a non-empty ZAK when role=1.
          zak: sig.zak ?? "",
        });
        if (cancelled) return;
        setPhase("in-meeting");

        cleanup = () => {
          try {
            client.leaveMeeting?.();
          } catch {
            // ignore
          }
          try {
            ZoomMtgEmbedded.destroyClient();
          } catch {
            // ignore
          }
        };
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Couldn't join the meeting.");
        setPhase("error");
      }
    }

    void start();
    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
    // Only re-init when sessionId changes. The user prop is read at
    // join time and never afterwards, so its identity churn (which
    // happens once when useCurrentUser resolves from null → loaded)
    // must not retear the SDK — that was the "keeps connecting and
    // disconnecting" loop fellows reported.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Host action — boots everyone via Zoom's end-meeting endpoint and
  // settles attendance using the proportional threshold (BRD §6.4).
  // Mirrors the SessionsTable kebab "End now" path so behaviour matches
  // whether the admin ends from the list or from inside the meeting.
  async function endSession() {
    const ok = await confirm({
      title: "End this session now?",
      message:
        "Everyone in the meeting will be booted. Attendance settles using a proportional threshold so fellows aren't punished for the early end.",
      confirmLabel: "End session",
      tone: "danger",
    });
    if (!ok) return;
    setEndingSession(true);
    try {
      await apiFetch(`/sessions/${encodeURIComponent(sessionId)}/end`, {
        method: "POST",
      });
      toast.success("Session ended", "Attendance has been settled.");
      setIsFullscreen(false);
      setPhase("left");
      onLeave?.();
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't end session", err);
    } finally {
      setEndingSession(false);
    }
  }

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-9999 flex flex-col bg-black"
          : "flex flex-col gap-3"
      }
    >
      {phase === "loading" && !isFullscreen && (
        <p className="text-sm text-gray-600">Loading meeting…</p>
      )}
      {phase === "joining" && !isFullscreen && (
        <p className="text-sm text-gray-600">Joining meeting…</p>
      )}
      {phase === "error" && !isFullscreen && (
        <div className="rounded-md border border-error-200 bg-error-50 p-3 text-sm text-error-700">
          {error}
        </div>
      )}

      {dialog}
      {/*
        Control bar sits ABOVE the meeting embed — earlier attempts
        positioned these buttons absolute over Zoom's UI, which always
        ended up colliding with Zoom's own top-right minimise/menu icon
        or its grid-view selector. Moving them out of the embed area
        entirely guarantees no overlap. In fullscreen mode this strip
        becomes part of the same vertical flex layout so it stays
        visible across the top.
      */}
      {phase === "in-meeting" && (
        <div
          className={
            isFullscreen
              ? "flex items-center justify-between gap-2 bg-black px-3 py-2"
              : "flex items-center justify-between gap-2"
          }
        >
          <button
            type="button"
            onClick={() => {
              if (isFullscreen) void exitFullscreen();
              else void enterFullscreen();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-fellowship-navy px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-fellowship-navy-dark"
            aria-label={
              isFullscreen ? "Exit fullscreen" : "Expand to fullscreen"
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              {isFullscreen ? (
                <path
                  fillRule="evenodd"
                  d="M4 9h3a1 1 0 001-1V5a1 1 0 112 0v3a3 3 0 01-3 3H4a1 1 0 110-2zm9-4a1 1 0 011 1v3a1 1 0 001 1h3a1 1 0 110 2h-3a3 3 0 01-3-3V6a1 1 0 011-1zm-9 6a1 1 0 011 1v3a1 1 0 001 1h3a1 1 0 110 2H6a3 3 0 01-3-3v-3a1 1 0 011-1zm13 0a1 1 0 011 1v3a3 3 0 01-3 3h-3a1 1 0 110-2h3a1 1 0 001-1v-3a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M3 5a2 2 0 012-2h3a1 1 0 010 2H5v3a1 1 0 11-2 0V5zm14 0v3a1 1 0 11-2 0V5h-3a1 1 0 110-2h3a2 2 0 012 2zM5 17h3a1 1 0 110 2H5a2 2 0 01-2-2v-3a1 1 0 112 0v3zm10 0v-3a1 1 0 112 0v3a2 2 0 01-2 2h-3a1 1 0 110-2h3z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>

          <div className="flex items-center gap-2">
            {!isFullscreen && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPhase("left");
                  onLeave?.();
                }}
              >
                Close meeting
              </Button>
            )}
            {isHost && (
              <button
                type="button"
                onClick={endSession}
                disabled={endingSession}
                className="rounded-lg bg-error-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-error-700 disabled:opacity-60"
              >
                {endingSession ? "Ending…" : "End session"}
              </button>
            )}
          </div>
        </div>
      )}

      <div
        ref={wrapperRef}
        className={
          isFullscreen
            ? "relative flex-1 bg-black"
            : "relative h-[70vh] w-full overflow-hidden rounded-2xl bg-black"
        }
      >
        <div ref={containerRef} className="absolute inset-0" />
      </div>
    </div>
  );
}
