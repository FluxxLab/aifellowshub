"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/**
 * First-visit tour for the fellow's `/learning` curriculum page.
 * Self-gates via localStorage (`pic-lms-tour:learning`) so it fires once
 * per device. Renders nothing if the page lacks the targeted anchors —
 * driver.js skips missing selectors silently.
 */
export default function LearningTour() {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="learning-heading"]',
      popover: {
        title: "Your 12-week curriculum",
        description:
          "One module per week. Each module has lessons, a live session, and an assessment.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="learning-progress"]',
      popover: {
        title: "Track your progress",
        description:
          "This is your overall completion across the cohort. Keep an eye on how many modules you've cleared vs. what's left.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="learning-modules"] > li:first-child',
      popover: {
        title: "Module cards",
        description:
          "Each card shows the module's status: locked, in-progress, or completed. Click an unlocked card to dive in.",
        side: "right",
        align: "start",
      },
    },
    {
      element: '[data-tour="learning-modules"] > li:first-child',
      popover: {
        title: "How to unlock the next module",
        description:
          "Attend the live session to unlock the next module. Miss one? You can watch the recording and still complete the module.",
        side: "right",
        align: "center",
      },
    },
  ];

  return <Tour pageKey="learning" steps={steps} />;
}
