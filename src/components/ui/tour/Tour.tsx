"use client";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api/client";
import "./tour.css";

type TourProps = {
  /** Steps in display order. `element` should be a `[data-tour="…"]` selector. */
  steps: DriveStep[];
  /**
   * Per-page identifier (e.g. "learning", "my-sessions"). When set, the
   * tour gates itself on `localStorage["pic-lms-tour:{pageKey}"]` so each
   * page's tour fires only the first time the user lands there. Without
   * a `pageKey` the tour falls back to the parent's gating (typically the
   * server-side `hasSeenTour` flag — used for the home + dashboard tours
   * that are first-login welcomes rather than per-page reveals).
   */
  pageKey?: string;
  /**
   * Tells the parent the tour finished/skipped. Default behaviour POSTs to
   * `/users/me/tour-seen`; pass `null` to disable persistence (e.g. tests).
   */
  onSeen?: (() => void) | null;
};

const TOUR_STORAGE_PREFIX = "pic-lms-tour:";

/** Storage key for a page-scoped tour completion flag. Exported so the
 *  user-menu "Restart tour" action can clear them all in one go. */
export function tourStorageKey(pageKey: string): string {
  return `${TOUR_STORAGE_PREFIX}${pageKey}`;
}

/**
 * Reusable first-visit tour built on driver.js. Renders nothing visually —
 * it attaches a tour to the elements with `data-tour="…"` anchors, runs
 * once after mount, and persists "seen" state via the parent's callback
 * (default: `POST /users/me/tour-seen`).
 *
 * Two gating modes:
 *   - **Page-scoped** (`pageKey` set): self-gates via localStorage so each
 *     page's tour only fires on the user's first visit there. Set the page
 *     key once and let the tour mount unconditionally — it short-circuits
 *     itself if already seen.
 *   - **Parent-gated** (no `pageKey`): the parent decides whether to mount
 *     based on the global `currentUser.hasSeenTour` flag. Used for the
 *     login-day welcome on home/dashboard.
 */
export default function Tour({
  steps,
  pageKey,
  onSeen = defaultOnSeen,
}: TourProps) {
  // Guard against React 18 StrictMode dev double-effects.
  const startedRef = useRef(false);
  const seenRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Per-page tours self-gate on localStorage so we don't need to mint
    // a per-page DB column for each new tour we add.
    if (pageKey && typeof window !== "undefined") {
      try {
        if (window.localStorage.getItem(tourStorageKey(pageKey))) return;
      } catch {
        // Private-browsing / disabled storage — fall through and run the
        // tour. Worst case: it runs on every visit until storage works.
      }
    }

    // Respect prefers-reduced-motion: skip the tour entirely.
    if (typeof window !== "undefined") {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      if (mq.matches) {
        markSeen();
        return;
      }
    }

    // On phones (≤640px) every popover side except "bottom" risks clipping
    // the viewport, since spotlights are usually full-width cards. Force
    // the side here rather than per-step so callers don't have to think
    // about it.
    const isPhone =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 640px)").matches;
    const stepsForViewport: DriveStep[] = isPhone
      ? steps.map((s) => ({
          ...s,
          popover: s.popover
            ? { ...s.popover, side: "bottom", align: "center" }
            : s.popover,
        }))
      : steps;

    // Wait one paint so any entry animations have settled before driver.js
    // measures spotlight positions.
    const timer = window.setTimeout(() => {
      const tour = driver({
        showProgress: true,
        progressText: "{{current}} of {{total}}",
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Got it",
        smoothScroll: true,
        allowClose: true,
        animate: true,
        overlayColor: "#0b1c34",
        overlayOpacity: 0.55,
        popoverClass: "pic-lms-tour",
        onDestroyStarted: () => {
          // Fires on Skip, Esc, or backdrop click.
          markSeen();
          tour.destroy();
        },
        onDestroyed: () => {
          markSeen();
        },
        steps: stepsForViewport,
      });

      tour.drive();
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };

    function markSeen() {
      if (seenRef.current) return;
      seenRef.current = true;
      // Page-scoped tours only need the localStorage flag — no backend
      // round-trip per page (we'd accumulate a write storm as the cohort
      // grows). The global welcome tours (no pageKey) keep posting to
      // `/users/me/tour-seen` so the server still knows you've onboarded.
      if (pageKey && typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            tourStorageKey(pageKey),
            new Date().toISOString(),
          );
        } catch {
          // Storage unavailable; nothing we can do client-side.
        }
        return;
      }
      onSeen?.();
    }
  }, [steps, onSeen, pageKey]);

  return null;
}

function defaultOnSeen() {
  apiFetch("/users/me/tour-seen", { method: "POST" }).catch(() => {
    // Backend offline: the per-instance guard prevents looping for this
    // session; next reload retries. Not worth surfacing an error.
  });
}
