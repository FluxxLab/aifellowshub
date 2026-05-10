"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/** First-visit tour for `/mentor` (BRD §6.10). */
export default function MentorHomeTour() {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="mentor-home-heading"]',
      popover: {
        title: "Your mentor home",
        description:
          "At-a-glance status of the fellows you mentor — assignments, replies you owe, capstones in flight, and your office hours.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="mentor-home-stats"]',
      popover: {
        title: "Your KPIs",
        description:
          "Watch the 'Awaiting your reply' card — that's the queue fellows are blocked on. Hours mentored is rolling weekly.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="mentor-home-awaiting"]',
      popover: {
        title: "Reply quickly here",
        description:
          "The top of the queue lives on this card. Click Reply on a row to open the full thread with that fellow.",
        side: "right",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="mentor-home" steps={steps} />;
}
