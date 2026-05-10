"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/** First-visit tour for `/faculty/grading`. */
export default function FacultyGradingTour() {
  const steps: DriveStep[] = [
    {
      element: "h1",
      popover: {
        title: "Grading queue",
        description:
          "Manual answers (written + uploaded) from fellows on your modules wait here for review. Multiple-choice scoring is automatic.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "h1",
      popover: {
        title: "Open an attempt",
        description:
          "Each card shows the fellow, the module, and how many manual answers still need a grade. Click Grade attempt to score and leave feedback.",
        side: "bottom",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="faculty-grading" steps={steps} />;
}
