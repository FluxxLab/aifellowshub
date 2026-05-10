"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/** First-visit tour for admin `/capstone` (BRD §6.10). */
export default function AdminCapstoneTour() {
  const steps: DriveStep[] = [
    {
      element: "h1",
      popover: {
        title: "Cohort capstones",
        description:
          "Every fellow's capstone in one view — title, mentor, stage, and last activity. Click any row to see the full thread.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "h1",
      popover: {
        title: "Mentor assignment",
        description:
          "Capstones default to the fellow's sector mentor. Use the row actions to reassign or pin a specific mentor when overrides are needed.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "h1",
      popover: {
        title: "Final approval = certificate",
        description:
          "When a mentor approves at the final stage and the fellow has cleared post-quizzes + attendance, the certificate is auto-issued.",
        side: "bottom",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="admin-capstone" steps={steps} />;
}
