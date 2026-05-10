"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/** First-visit tour for `/faculty/modules`. */
export default function FacultyModulesTour() {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="faculty-modules-heading"]',
      popover: {
        title: "Your authored modules",
        description:
          "Every module you own. Drafts and admin submissions are pinned to the top so you can finish what's in flight.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="faculty-modules-new"]',
      popover: {
        title: "Propose a new module",
        description:
          "New modules start as a draft — admin reviews and assigns it a week slot when you submit. The unlock chain stays intact.",
        side: "left",
        align: "start",
      },
    },
    {
      element: '[data-tour="faculty-modules-list"] > li:first-child',
      popover: {
        title: "Open a module",
        description:
          "Each card surfaces fellow uptake (active + average score). Open it to edit lessons, the assessment, or the resource list.",
        side: "top",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="faculty-modules" steps={steps} />;
}
