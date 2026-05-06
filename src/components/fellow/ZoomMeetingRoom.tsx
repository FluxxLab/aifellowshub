"use client";
import React, { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/button/Button";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";

type SignatureResponse = {
  signature: string;
  sdkKey: string;
  meetingNumber: string;
  role: number;
  sessionTitle: string;
};

/**
 * React 18 → 19 compatibility shim for @zoom/meetingsdk.
 *
 * The Zoom Meeting SDK 6.0.0 reaches for the old React 18 internal
 * `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner`
 * which no longer exists in React 19 (Next.js 16 requires React 19).
 * Without the shim the SDK throws `Cannot read properties of undefined`
 * during init and the embed is unusable.
 *
 * The SDK only reads ReactCurrentOwner for dev-mode warnings; a
 * stubbed shape with `current: null` is enough to keep it happy.
 * Safe to leave in place — when Zoom ships React 19 support and we
 * upgrade the SDK, the shim becomes a no-op (the property already
 * exists on the SDK's side, our assignment is conditional).
 */
const reactInternals = (React as unknown as Record<string, unknown>)
  .__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
if (!reactInternals) {
  (React as unknown as Record<string, unknown>).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
    ReactCurrentOwner: { current: null },
    ReactCurrentDispatcher: { current: null },
    ReactCurrentBatchConfig: { transition: null },
    ReactDebugCurrentFrame: { setExtraStackFrame: () => undefined },
  };
}

/**
 * Embeds a Zoom meeting inside the LMS via the Meeting SDK Component View
 * (BRD §6.4). Loads the SDK lazily so the heavy WASM bundle never ships
 * to non-meeting pages, then mounts the Zoom UI into a `<div>` rendered
 * in this component.
 *
 * Cleanup is critical — `destroyClient()` must run on unmount or the next
 * mount will fail with "client is already initialised".
 *
 * Note: the SDK requires COOP/COEP headers OR a cross-origin isolated
 * context for the WASM SharedArrayBuffer path. Next.js needs explicit
 * `headers()` config for that — see `next.config`. Without isolation the
 * SDK falls back to a slower path but still works.
 */
export default function ZoomMeetingRoom({
  sessionId,
  onLeave,
}: {
  sessionId: string;
  onLeave?: () => void;
}) {
  const user = useCurrentUser();
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<unknown>(null);
  const [phase, setPhase] = useState<
    "loading" | "joining" | "in-meeting" | "left" | "error"
  >("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    async function start() {
      try {
        // 1. Mint a signature for this session.
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

        // 2. Lazy-load the Component View — avoids shipping ~3MB on every
        //    page and dodges SSR (the SDK reaches for `window`).
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
        await client.join({
          signature: sig.signature,
          sdkKey: sig.sdkKey,
          meetingNumber: sig.meetingNumber,
          userName: user?.fullName ?? "PIC LMS Fellow",
          userEmail: user?.email ?? "",
          password: "",
        });
        if (cancelled) return;
        setPhase("in-meeting");

        // 3. On unmount: leave + destroy. Without these the next mount
        //    errors out and the meeting page is unusable.
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

  return (
    <div className="flex flex-col gap-3">
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
      {/*
        Zoom mounts its UI here. The element MUST stay in the DOM the whole
        time the meeting is live; React must NOT re-render its children.
        The SDK manages the inner DOM directly.
      */}
      <div
        ref={containerRef}
        className="min-h-[480px] w-full overflow-hidden rounded-2xl bg-black"
      />
      {phase === "in-meeting" && (
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
