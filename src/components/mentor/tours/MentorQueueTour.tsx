"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/** First-visit tour for `/mentor/queue`. */
export default function MentorQueueTour() {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="mentor-queue-heading"]',
      popover: {
        title: "The full review queue",
        description:
          "Every fellow you're assigned to. Rows awaiting your reply are highlighted and sit at the top.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="mentor-queue-stats"]',
      popover: {
        title: "Where to focus",
        description:
          "Awaiting-reply and not-started counts surface the slack — pull those rows in first. Submitted/under-review is the work in progress.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="mentor-queue-table"]',
      popover: {
        title: "Open a thread",
        description:
          "Click Review on any row to open the fellow's capstone — drafts, milestones, stakeholders, and the full feedback thread.",
        side: "top",
        align: "center",
      },
    },
  ];

  return <Tour pageKey="mentor-queue" steps={steps} />;
}
