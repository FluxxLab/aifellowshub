"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Retry helper for App Router `error.tsx` boundaries.
 *
 * Why it exists: `reset()` alone only re-renders the boundary — it doesn't
 * re-run the server component's data fetch, so on a flaky connection the
 * manual button just throws again. We pair `router.refresh()` (re-fetches
 * server data) with `reset()`, and add a BOUNDED auto-retry with backoff so
 * intermittent drops (the common "poor network" case) self-heal without the
 * fellow tapping anything.
 *
 * Bounded how: attempts are counted in sessionStorage keyed by `key`, inside
 * a rolling window. The error boundary re-mounts each time a retry fails,
 * which would otherwise reset an in-memory counter and loop forever — the
 * sessionStorage counter survives remounts, so after MAX_AUTO attempts we
 * stop auto-retrying and surface the manual button (important: a persistent
 * backend 500 must NOT spin the device). A manual tap clears the counter so
 * the fellow can keep trying.
 */
const MAX_AUTO = 3;
const WINDOW_MS = 60_000;

type AttemptRecord = { count: number; first: number };

export function useErrorRetry(reset: () => void, key: string) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [autoExhausted, setAutoExhausted] = useState(false);

  const doRetry = useCallback(() => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }, [router, reset]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storeKey = `retry:${key}`;

    let rec: AttemptRecord = { count: 0, first: Date.now() };
    try {
      const raw = sessionStorage.getItem(storeKey);
      if (raw) rec = JSON.parse(raw) as AttemptRecord;
    } catch {
      /* sessionStorage unavailable (private mode) — fall back to fresh */
    }
    // Reset the window once it's elapsed, so a fellow who hits a fresh
    // problem minutes later gets a fresh round of auto-retries.
    if (Date.now() - rec.first > WINDOW_MS) rec = { count: 0, first: Date.now() };

    if (rec.count >= MAX_AUTO) {
      setAutoExhausted(true);
      return;
    }

    // Exponential backoff: 2s, 4s, 8s — spaced enough to catch a recovering
    // connection without hammering a genuinely-down backend.
    const delay = 2000 * 2 ** rec.count;
    const timer = setTimeout(() => {
      const next: AttemptRecord = { count: rec.count + 1, first: rec.first };
      try {
        sessionStorage.setItem(storeKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      doRetry();
    }, delay);
    return () => clearTimeout(timer);
  }, [key, doRetry]);

  const manualRetry = useCallback(() => {
    try {
      sessionStorage.removeItem(`retry:${key}`);
    } catch {
      /* ignore */
    }
    setAutoExhausted(false);
    doRetry();
  }, [key, doRetry]);

  // `autoRetrying` is true while we're either waiting on a scheduled
  // auto-retry or a retry transition is in flight (and we haven't given up).
  return { isPending, autoExhausted, manualRetry, autoRetrying: !autoExhausted };
}
