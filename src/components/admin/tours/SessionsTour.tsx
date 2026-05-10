"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/** First-visit tour for admin `/sessions` (BRD §6.4). */
export default function SessionsTour() {
  const steps: DriveStep[] = [
    {
      element: "h1",
      popover: {
        title: "Live sessions",
        description:
          "Schedule sessions, monitor registrations, and manage attendance. Sessions run on Zoom but join happens inside the LMS.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "h1",
      popover: {
        title: "Auto-credited attendance",
        description:
          "Fellows who stay in the room for ≥50% of the session get credit automatically. You can override per fellow from the session detail page.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "h1",
      popover: {
        title: "Recordings",
        description:
          "When a session ends, the Zoom cloud recording is pulled to DigitalOcean Spaces. Fellows who missed it can watch and earn half-credit.",
        side: "bottom",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="admin-sessions" steps={steps} />;
}
