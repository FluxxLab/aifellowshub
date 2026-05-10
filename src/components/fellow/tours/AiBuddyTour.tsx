"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/**
 * First-visit tour for the fellow's `/ai-buddy` page (BRD §6.7).
 * Self-gates via localStorage (`pic-lms-tour:ai-buddy`).
 */
export default function AiBuddyTour() {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="ai-buddy-heading"]',
      popover: {
        title: "Meet your AI Buddy",
        description:
          "Use it to break down readings, draft policy briefs, and prep for assessments. It's trained on the Fellowship curriculum.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="ai-buddy-quota"]',
      popover: {
        title: "20 messages a day",
        description:
          "Your daily allowance is shown here and resets at midnight UTC. Use it on the hard questions — short answers come faster.",
        side: "left",
        align: "start",
      },
    },
    {
      element: '[data-tour="ai-buddy-chat"]',
      popover: {
        title: "Type or pick a starter",
        description:
          "Suggested prompts get you going on common tasks. Hit Enter to send; Shift+Enter for a new line.",
        side: "top",
        align: "center",
      },
    },
  ];

  return <Tour pageKey="ai-buddy" steps={steps} />;
}
