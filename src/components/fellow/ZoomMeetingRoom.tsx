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
  const [isHost, setIsHost] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const router = useRouter();
  const { confirm, dialog } = useConfirm();

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
              // No defaultViewType. We tried "speaker" to push the
              // SDK out of its Minimized default — it did expand the
              // single-participant tile, but Zoom's speaker view
              // never renders the bottom toolbar (mic / camera /
              // share / leave). Fellows couldn't mute themselves.
              // For the cohort launch, having functional meeting
              // controls beats having a slightly bigger placeholder
              // tile during solo testing. With 2+ participants in a
              // real session, Zoom auto-expands the active speaker
              // tile via its own layout — solo testing is the only
              // case where the tile reads as small.
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
        // Wait for useCurrentUser() to resolve before calling join.
        // The hook starts at LOADING_USER (id="" fullName="") and
        // fills in once /api/auth/me responds — usually <100ms. If
        // the SDK init finished first we used to call client.join
        // with the empty placeholder name, and Zoom rejected with
        // "userName cannot be empty". Poll up to 3s; fall back to a
        // generic name if the hook never settles (shouldn't happen
        // in normal auth flow but guards against a permanent stall).
        let currentUser = userRef.current;
        const waitStart = Date.now();
        while (
          (!currentUser?.fullName?.trim() || !currentUser?.id) &&
          Date.now() - waitStart < 3000
        ) {
          await new Promise((r) => setTimeout(r, 100));
          if (cancelled) return;
          currentUser = userRef.current;
        }
        // `||` (not `??`) so an empty-string fullName also falls
        // back — `??` was the original bug: LOADING_USER.fullName is
        // "", not null, so the nullish coalesce never triggered.
        const userName =
          currentUser?.fullName?.trim() || "PIC LMS Fellow";
        const userEmail = currentUser?.email?.trim() || "";
        const customerKey = currentUser?.id || currentUser?.email || undefined;

        await client.join({
          signature: sig.signature,
          meetingNumber: sig.meetingNumber,
          userName,
          userEmail,
          password: sig.meetingPassword ?? "",
          customerKey,
          // ZAK promotes the joiner to host on Zoom's side. Without it
          // an admin signing in with role=1 would hang at "Connecting".
          // Backend only returns a non-empty ZAK when role=1.
          zak: sig.zak ?? "",
        });
        if (cancelled) return;
        setPhase("in-meeting");

        // Earlier iterations called client.setViewType("speaker") here
        // to re-nudge the SDK out of Minimized. That call landed during
        // the SDK's post-join settlement window and was triggering
        // connect/disconnect loops mid-join — fellows reported "keeps
        // disconnecting before connecting" and the mic/camera toolbar
        // never rendered. defaultViewType at init is init-only per
        // the SDK types but stable; the runtime nudge stays only on
        // the user-gesture fullscreen-enter path.

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
      className="flex flex-col gap-3"
    >
      {phase === "loading" && (
        <p className="text-sm text-gray-600">Loading meeting…</p>
      )}
      {phase === "joining" && (
        <p className="text-sm text-gray-600">Joining meeting…</p>
      )}
      {phase === "error" && (
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
        <div className="flex items-center justify-end gap-2">
          <div className="pointer-events-auto flex items-center gap-2">
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
        className="zoom-meeting-fill relative h-[70vh] w-full overflow-hidden rounded-2xl bg-black"
      >
        <div ref={containerRef} className="absolute inset-0" />
        {/*
          Earlier iterations injected CSS overrides on .video-popper
          to force the Zoom embed to fill the wrapper. The
          width/height: 100% nudge on its own was clean, but every
          variant we tried (position: absolute, inset: 0, max-width:
          none, etc.) ended up clipping Zoom's bottom toolbar —
          fellows lost the mic / camera / share / leave row. The
          official Zoom forum thread on filling Component View
          confirms there's no supported CSS pattern; Zoom's
          recommended workaround is "switch to Client View in an
          iframe," which is a bigger architectural change. For now
          we trust Zoom's own layout: the tile is small when alone,
          auto-expands on multi-participant sessions, and the
          toolbar stays where the SDK puts it.
        */}
      </div>
    </div>
  );
}
