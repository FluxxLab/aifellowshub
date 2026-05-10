"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/** First-visit tour for admin `/settings`. */
export default function SettingsTour() {
  const steps: DriveStep[] = [
    {
      element: "h1",
      popover: {
        title: "Programme controls",
        description:
          "Cohort capacity, registration window, notification defaults, attendance threshold, and certification scoring all live here.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "h1",
      popover: {
        title: "Live changes",
        description:
          "Edits take effect immediately and are audited. Keep the certification weights summing to 1.0 — the form validates before save.",
        side: "bottom",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="admin-settings" steps={steps} />;
}
