"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/**
 * First-visit tour for the fellow's `/my-sessions` page.
 * Self-gates via localStorage (`pic-lms-tour:my-sessions`) — fires once
 * the first time a fellow lands on the sessions list.
 */
export default function SessionsTour() {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="sessions-heading"]',
      popover: {
        title: "Your live sessions",
        description:
          "Twelve sessions, one per module. They run on Zoom, but you join right inside the LMS — no app needed.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="sessions-stats"]',
      popover: {
        title: "Attendance at a glance",
        description:
          "Here's how many you've attended and your current attendance rate. Aim to keep it above the cohort threshold.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="sessions-heading"]',
      popover: {
        title: "How attendance is credited",
        description:
          "Stay in the room for at least 50% of the session and credit lands automatically. Miss it? Watching the full recording earns half-credit.",
        side: "bottom",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="my-sessions" steps={steps} />;
}
