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
  const clientRef = useRef<unknown>(null);
  const [phase, setPhase] = useState<
    "loading" | "joining" | "in-meeting" | "left" | "error"
  >("loading");
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(startFullscreen);
  const [isHost, setIsHost] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const router = useRouter();
  const { confirm, dialog } = useConfirm();

  // Esc exits fullscreen — matches every other "expanded" UI on the
  // web, and keeps users from getting trapped if the in-meeting Exit
  // button overlaps a Zoom control.
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    // Hide page scroll while fullscreen so the body can't scroll behind
    // the meeting.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isFullscreen]);

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
        await client.join({
          signature: sig.signature,
          meetingNumber: sig.meetingNumber,
          userName: user?.fullName ?? "PIC LMS Fellow",
          userEmail: user?.email ?? "",
          password: sig.meetingPassword ?? "",
          customerKey: user?.id ?? user?.email ?? undefined,
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
  }, [sessionId, user?.fullName, user?.email]);

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

      {/*
        Wrapper is `relative` so the Expand / Exit fullscreen button can
        be positioned in the corner of the meeting tile without
        affecting Zoom's inner DOM. Zoom manages everything inside
        `containerRef`.
      */}
      {dialog}
      <div
        className={
          isFullscreen
            ? "relative flex-1 bg-black"
            : "relative h-[70vh] w-full overflow-hidden rounded-2xl bg-black"
        }
      >
        <div ref={containerRef} className="absolute inset-0" />
        {phase === "in-meeting" && (
          <div className="absolute right-3 top-3 z-10 flex gap-2">
            {isHost && (
              <button
                type="button"
                onClick={endSession}
                disabled={endingSession}
                className="rounded-md bg-error-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-error-700 disabled:opacity-60"
              >
                {endingSession ? "Ending…" : "End session"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsFullscreen((v) => !v)}
              className="rounded-md bg-black/60 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-black/80"
              aria-label={
                isFullscreen ? "Exit fullscreen" : "Expand to fullscreen"
              }
            >
              {isFullscreen ? "Exit fullscreen (Esc)" : "Expand"}
            </button>
          </div>
        )}
      </div>

      {phase === "in-meeting" && !isFullscreen && (
        <div className="flex justify-end">
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
        </div>
      )}
    </div>
  );
}
