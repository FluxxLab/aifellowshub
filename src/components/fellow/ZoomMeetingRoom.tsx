"use client";
import React, { useEffect, useState } from "react";
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
 * Embeds a Zoom meeting via the Meeting SDK **Client View** (BRD §6.4).
 *
 * Why Client View instead of Component View:
 *   The Component View (`@zoom/meetingsdk/embedded`) bundles its own
 *   React 18.2 internals access pattern that breaks under Next.js 15's
 *   bundler — it crashes with `Cannot read properties of undefined
 *   (reading 'ReactCurrentOwner')` because Next ships a different React
 *   build to client chunks. Pinning React to 18.2.0 fixes the SDK but
 *   breaks Next 15 (which calls `React.cache()`, only available in
 *   ≥ 18.3). The Client View loads its asset bundle at runtime via
 *   `prepareWebSDK`, so it brings its own React + ReactDOM and never
 *   touches the host React tree.
 *
 * Trade-off: Client View takes over the page (full-screen `#zmmtg-root`)
 * rather than rendering inline. We hide it on unmount and clean up.
 *
 * Cross-origin isolation (COOP `same-origin` + COEP `require-corp`) is
 * still required for the WASM SharedArrayBuffer path — see next.config.
 */
export default function ZoomMeetingRoom({
  sessionId,
  onLeave,
}: {
  sessionId: string;
  onLeave?: () => void;
}) {
  const user = useCurrentUser();
  const [phase, setPhase] = useState<
    "loading" | "joining" | "in-meeting" | "left" | "error"
  >("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

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

        // Client View is exported from the package root (not /embedded).
        // The SDK ships its own React 18.2 inside the runtime bundle it
        // pulls from `source.zoom.us` via prepareWebSDK, so the host
        // React version is irrelevant once this is set up.
        const mod = await import("@zoom/meetingsdk");
        if (cancelled) return;
        const ZoomMtg =
          (mod as unknown as { ZoomMtg?: typeof import("@zoom/meetingsdk").ZoomMtg })
            .ZoomMtg ??
          (mod as unknown as { default: typeof import("@zoom/meetingsdk").ZoomMtg })
            .default;

        // Lib version MUST match the npm @zoom/meetingsdk version exactly,
        // otherwise the CDN bundle's runtime contracts (React internals
        // access, redux store shape, etc.) drift from the npm wrapper and
        // joining throws `ReactCurrentOwner` or similar internal errors.
        ZoomMtg.setZoomJSLib("https://source.zoom.us/6.0.0/lib", "/av");
        ZoomMtg.preLoadWasm();
        ZoomMtg.prepareWebSDK();

        // Make sure the SDK's mount point exists. It's removed on unmount.
        ensureZoomRoot();

        setPhase("joining");
        await new Promise<void>((resolve, reject) => {
          ZoomMtg.init({
            leaveUrl: window.location.href,
            patchJsMedia: true,
            success: () => resolve(),
            error: (e: unknown) =>
              reject(
                new Error(
                  (e as { errorMessage?: string })?.errorMessage ??
                    "Couldn't initialise meeting.",
                ),
              ),
          });
        });
        if (cancelled) return;

        await new Promise<void>((resolve, reject) => {
          ZoomMtg.join({
            signature: sig.signature,
            sdkKey: sig.sdkKey,
            meetingNumber: sig.meetingNumber,
            userName: user?.fullName ?? "PIC LMS Fellow",
            userEmail: user?.email ?? "",
            passWord: "",
            success: () => resolve(),
            error: (e: unknown) =>
              reject(
                new Error(
                  (e as { errorMessage?: string })?.errorMessage ??
                    "Couldn't join meeting.",
                ),
              ),
          });
        });
        if (cancelled) return;
        setPhase("in-meeting");
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Couldn't join the meeting.");
        setPhase("error");
      }
    }

    void start();
    return () => {
      cancelled = true;
      // Hide the SDK chrome on unmount so navigating away doesn't leave
      // the Zoom UI floating over the next page. Don't delete the node —
      // the SDK keeps internal references and removing it can throw.
      const root = document.getElementById("zmmtg-root");
      if (root) root.style.display = "none";
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
      {phase === "in-meeting" && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const root = document.getElementById("zmmtg-root");
              if (root) root.style.display = "none";
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

/**
 * Client View renders into `#zmmtg-root`. The SDK creates it on init,
 * but if a previous meeting hid it we need to restore visibility.
 */
function ensureZoomRoot() {
  let root = document.getElementById("zmmtg-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "zmmtg-root";
    document.body.appendChild(root);
  }
  root.style.display = "block";
}
