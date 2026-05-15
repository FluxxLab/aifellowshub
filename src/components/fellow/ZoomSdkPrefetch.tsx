"use client";
import { useEffect } from "react";

/**
 * Warm-loads the Zoom Meeting SDK on idle so the ~3 MB bundle is
 * already in the browser cache when a fellow clicks "Join in app".
 * Cuts first-join connect time from ~4-7s (download + handshake)
 * down to roughly the Zoom handshake alone (~3-5s).
 *
 * Renders nothing. Drop it on any page where fellows are likely to
 * click Join shortly — module detail, /my-sessions, fellow home.
 * The dynamic import is idempotent so mounting this on multiple
 * pages doesn't re-download.
 */
export default function ZoomSdkPrefetch() {
  useEffect(() => {
    // requestIdleCallback so we don't compete with the main page
    // hydration or any data-fetching the user actually waited for.
    // Safari doesn't have requestIdleCallback; fall back to a small
    // setTimeout so the prefetch still happens, just less politely.
    type IdleHandle = number;
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void) => IdleHandle;
      cancelIdleCallback?: (h: IdleHandle) => void;
    };
    const w = window as IdleWindow;

    const start = () => {
      void import("@zoom/meetingsdk/embedded").catch(() => {
        // Network blip, offline — Join click will retry. No-op.
      });
    };

    let idleHandle: IdleHandle | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    if (w.requestIdleCallback) {
      idleHandle = w.requestIdleCallback(start);
    } else {
      timeoutHandle = setTimeout(start, 1500);
    }
    return () => {
      if (idleHandle !== null && w.cancelIdleCallback) {
        w.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
    };
  }, []);
  return null;
}
