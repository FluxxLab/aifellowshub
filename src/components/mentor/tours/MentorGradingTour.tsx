"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/** First-visit tour for `/mentor/grading`. */
export default function MentorGradingTour() {
  const steps: DriveStep[] = [
    {
      element: "h1",
      popover: {
        title: "Manual grading",
        description:
          "Multiple-choice answers auto-score; written and uploaded answers from your fellows wait here for your review.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "h1",
      popover: {
        title: "Open an attempt",
        description:
          "Each card shows how many manual answers still need a grade. Click Grade attempt to score, leave feedback, and finalise.",
        side: "bottom",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="mentor-grading" steps={steps} />;
}
