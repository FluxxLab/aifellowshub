"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/**
 * First-visit tour for `/faculty/sessions`. Faculty see only sessions
 * scheduled on modules under courses they own (the backend filters on
 * `module.course.ownerId`); admins see the cohort-wide list.
 */
export default function FacultySessionsTour() {
  const steps: DriveStep[] = [
    {
      element: "h1",
      popover: {
        title: "Live sessions on your modules",
        description:
          "Every session scheduled under a course you own. Schedule new ones, edit times, or end one early — all the same controls as the admin view, scoped to your content.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "h1",
      popover: {
        title: "Auto-credited attendance",
        description:
          "Fellows who stay in the room for ≥50% of the session get credit automatically (BRD §6.4). You can override per fellow from the session detail page.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "h1",
      popover: {
        title: "Recordings",
        description:
          "Once a session ends, the Zoom cloud recording is pulled to DigitalOcean Spaces. Fellows who missed live can earn half-credit by watching the full recording.",
        side: "bottom",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="faculty-sessions" steps={steps} />;
}
