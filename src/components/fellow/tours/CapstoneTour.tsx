"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/**
 * First-visit tour for the fellow's `/my-capstone` page (BRD §6.10).
 * Self-gates via localStorage (`pic-lms-tour:my-capstone`).
 */
export default function CapstoneTour() {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="capstone-heading"]',
      popover: {
        title: "Your capstone",
        description:
          "Build it iteratively over the 12 weeks. Save often — your mentor reviews drafts as you submit them.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="capstone-status"]',
      popover: {
        title: "Where you stand",
        description:
          "Status, last save, and word count live here. Statuses move draft → under review → approved as your mentor weighs in.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="capstone-status"]',
      popover: {
        title: "Submit when you're ready",
        description:
          "Each stage (scoping, design, build, final) wants its own submission. Approval at the final stage auto-issues your certificate.",
        side: "bottom",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="my-capstone" steps={steps} />;
}
