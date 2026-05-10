"use client";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useEffect, useRef } from "react";
import "./tour.css";

type TourProps = {
  /** Steps in display order. `element` should be a `[data-tour="…"]` selector. */
  steps: DriveStep[];
  /**
   * Per-page identifier (e.g. "learning", "my-sessions"). The tour gates
   * itself on `localStorage["pic-lms-tour:{pageKey}"]` so each page's
   * tour fires only the first time the user lands there.
   */
  pageKey: string;
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
 * once after mount, and writes a per-page flag to localStorage so it
 * doesn't re-fire on subsequent visits. "Restart tour" in the user menu
 * wipes those flags so the whole walkthrough can be replayed on demand.
 */
export default function Tour({ steps, pageKey }: TourProps) {
  // Guard against React 18 StrictMode dev double-effects.
  const startedRef = useRef(false);
  const seenRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Self-gate on localStorage so we don't need a per-page DB column
    // for each new tour we add.
    if (typeof window !== "undefined") {
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
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(
          tourStorageKey(pageKey),
          new Date().toISOString(),
        );
      } catch {
        // Storage unavailable; nothing we can do client-side.
      }
    }
  }, [steps, pageKey]);

  return null;
}
