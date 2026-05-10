"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/** First-visit tour for `/mentor/requests`. */
export default function MentorRequestsTour() {
  const steps: DriveStep[] = [
    {
      element: "h1",
      popover: {
        title: "Coaching requests",
        description:
          "Fellows can request 1:1 sessions outside their assigned mentorship. You decide whether to accept; admin schedules the slot once you do.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "h1",
      popover: {
        title: "Accept or decline",
        description:
          "Each row shows the fellow, their topic, and proposed times. Decline messages are visible to the fellow — keep them constructive.",
        side: "bottom",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="mentor-requests" steps={steps} />;
}
