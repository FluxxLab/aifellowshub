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
  joinUrl,
  onLeave,
}: {
  sessionId: string;
  joinUrl?: string;
  onLeave?: () => void;
}) {
  const user = useCurrentUser();
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null); // kept for potential future use
  const clientRef = useRef<unknown>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [phase, setPhase] = useState<
    "loading" | "joining" | "in-meeting" | "left" | "error"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const router = useRouter();
  const { confirm, dialog } = useConfirm();


  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  // Hold the latest user in a ref so start() can read the real name
  // without forcing the SDK to re-init each time the user object's
  // identity changes (useCurrentUser swaps the reference on every
  // refresh / refetch even when the underlying name/email stay put).
  const userRef = useRef(user);
  userRef.current = user;

  // Tracks whether we have an unmatched 'join' in flight so we only
  // fire 'leave' if we actually joined (avoids spurious leave pings on
  // error paths). keepalive: true ensures the request survives tab close.
  const attendJoinedRef = useRef(false);
  const creditTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function recordAttend(action: "join" | "leave" | "credit") {
    if (action === "leave" && !attendJoinedRef.current) return;
    if (action === "join") attendJoinedRef.current = true;
    if (action === "leave") {
      attendJoinedRef.current = false;
      if (creditTimerRef.current) {
        clearTimeout(creditTimerRef.current);
        creditTimerRef.current = null;
      }
    }
    fetch(`/api/sessions/${encodeURIComponent(sessionId)}/attend`, {
      method: "POST",
      credentials: "include",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).catch(() => {});
  }

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

        await client.init({
          zoomAppRoot: containerRef.current,
          language: "en-US",
          patchJsMedia: true,
          leaveOnPageUnload: true,
          customize: {
            video: {
              // SuspensionViewType is a const enum — cast needed to pass string literal
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              defaultViewType: "gallery" as any,
              isResizable: true,
              // Lower the ribbon-mode threshold so the SDK stays in wide
              // gallery layout on normal laptop/desktop content-area widths.
              // Default SDK threshold is 1040px; setting 640px means ribbon
              // only kicks in on very narrow viewports.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              viewSizes: { default: { width: 640, height: 480 } } as any,
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
        recordAttend("join");
        // Silently credit after 30 minutes — no UI feedback, fellows
        // don't know when the threshold fires.
        creditTimerRef.current = setTimeout(() => {
          recordAttend("credit");
        }, 30 * 60 * 1000);

        // Earlier iterations called client.setViewType("speaker") here
        // to re-nudge the SDK out of Minimized. That call landed during
        // the SDK's post-join settlement window and was triggering
        // connect/disconnect loops mid-join — fellows reported "keeps
        // disconnecting before connecting" and the mic/camera toolbar
        // never rendered. defaultViewType at init is init-only per
        // the SDK types but stable; the runtime nudge stays only on
        // the user-gesture fullscreen-enter path.

        cleanup = () => {
          recordAttend("leave");
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
      recordAttend("leave");
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

  if (isMobile) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-gray-900 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Join on Zoom</h3>
          <p className="mt-1 text-sm text-gray-400">
            For the best audio and video experience on mobile, open the session in the Zoom app.
          </p>
        </div>
        {joinUrl && joinUrl !== "#" ? (
          <a
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
          >
            Open in Zoom app
          </a>
        ) : (
          <p className="text-sm text-gray-500">Join link not available yet.</p>
        )}
      </div>
    );
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
                  recordAttend("leave");
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

      {/*
        overflow-hidden on the wrapper was intercepting pointer events for
        the SDK's absolutely-positioned chat and participants panels —
        they were visible but unclickable. Removed it; border-radius on
        the wrapper is purely cosmetic and still applies without clipping.
        The zoom-room class scopes the SDK isolation CSS in globals.css.
      */}
      <div
        ref={wrapperRef}
        className="zoom-room w-full min-h-[65vh] rounded-2xl bg-black"
      >
        <div ref={containerRef} className="w-full" />
      </div>
    </div>
  );
}
