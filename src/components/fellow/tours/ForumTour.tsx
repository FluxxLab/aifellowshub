"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/**
 * First-visit tour for `/forum` (BRD §6.8).
 * Self-gates via localStorage (`pic-lms-tour:forum`).
 */
export default function ForumTour() {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="forum-heading"]',
      popover: {
        title: "Cohort forum",
        description:
          "Group chat with fellows, mentors, and admins. Use it for questions, sharing readings, and scoping ideas.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="forum-groups"]',
      popover: {
        title: "Pick a group",
        description:
          "Each group is its own conversation — General is open to everyone, others are sector or cohort-specific.",
        side: "right",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="forum" steps={steps} />;
}
