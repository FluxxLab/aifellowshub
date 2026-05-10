"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/** First-visit tour for `/faculty` (BRD §6.3, §6.5). */
export default function FacultyHomeTour() {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="faculty-home-heading"]',
      popover: {
        title: "Faculty home",
        description:
          "Modules you author + how fellows are using them. This is the curator's command centre — content + signal in one place.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="faculty-home-stats"]',
      popover: {
        title: "Pipeline state",
        description:
          "Modules you own, what's published vs. in draft, and what's awaiting admin review. Drafts and submissions never time out — admin reviews when ready.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="faculty-home-inflight"]',
      popover: {
        title: "What's in flight",
        description:
          "Drafts and admin submissions you can edit or follow up on. Published modules can still be revised — open one to propose changes.",
        side: "right",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="faculty-home" steps={steps} />;
}
