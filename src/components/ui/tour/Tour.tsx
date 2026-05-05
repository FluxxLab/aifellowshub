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
   * Tells the parent the tour finished/skipped. Default behaviour POSTs to
   * `/users/me/tour-seen`; pass `null` to disable persistence (e.g. tests).
   */
  onSeen?: (() => void) | null;
};

/**
 * Reusable first-login tour built on driver.js. Renders nothing visually —
 * it attaches a tour to the elements with `data-tour="…"` anchors, runs
 * once after mount, and persists "seen" state via the parent's callback
 * (default: `POST /users/me/tour-seen`).
 *
 * Gating: the parent should only mount this when the user hasn't seen the
 * tour yet (`currentUser.hasSeenTour === false`).
 */
export default function Tour({ steps, onSeen = defaultOnSeen }: TourProps) {
  // Guard against React 18 StrictMode dev double-effects.
  const startedRef = useRef(false);
  const seenRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

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
      onSeen?.();
    }
  }, [steps, onSeen]);

  return null;
}

function defaultOnSeen() {
  apiFetch("/users/me/tour-seen", { method: "POST" }).catch(() => {
    // Backend offline: the per-instance guard prevents looping for this
    // session; next reload retries. Not worth surfacing an error.
  });
}
