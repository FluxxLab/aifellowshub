"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/**
 * First-visit tour for `/library` (BRD §6.9).
 * Self-gates via localStorage (`pic-lms-tour:library`).
 */
export default function LibraryTour() {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="library-heading"]',
      popover: {
        title: "Curated readings & frameworks",
        description:
          "Everything the faculty surfaced for the curriculum lives here — papers, audits, templates, and recordings.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="library-search"]',
      popover: {
        title: "Search and filter",
        description:
          "Filter by kind (paper, video, template) or source (faculty, mentor, fellow). Pin anything you want to come back to.",
        side: "bottom",
        align: "center",
      },
    },
  ];

  return <Tour pageKey="library" steps={steps} />;
}
