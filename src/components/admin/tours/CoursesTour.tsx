"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/** First-visit tour for `/courses` (BRD §6.3). */
export default function CoursesTour() {
  const steps: DriveStep[] = [
    {
      element: "h1",
      popover: {
        title: "Cohort curriculum",
        description:
          "All courses + the modules under each. Faculty curates content; admin enforces ordering and the publish workflow.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "h1",
      popover: {
        title: "Module unlock rule",
        description:
          "Each module unlocks when the previous module's session was attended OR its assessment was passed (BRD §6.3). Reordering preserves that chain.",
        side: "bottom",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="admin-courses" steps={steps} />;
}
