"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/**
 * First-visit tour for the fellow's `/my-certificates` page (BRD §6.6).
 * Self-gates via localStorage (`pic-lms-tour:my-certificates`).
 */
export default function CertificatesTour() {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="certificate-heading"]',
      popover: {
        title: "Your certificate, when you earn it",
        description:
          "We auto-issue once your capstone is approved at the final stage and you've cleared the post-quiz / attendance bars.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="certificate-heading"]',
      popover: {
        title: "Track your scorecard",
        description:
          "Until you're eligible, you'll see exactly what's still required: post-quizzes passed, sessions attended, and capstone approval.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="certificate-heading"]',
      popover: {
        title: "Public verification",
        description:
          "Once issued, every certificate has a public URL anyone can verify — no login required. Share it on LinkedIn or your CV.",
        side: "bottom",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="my-certificates" steps={steps} />;
}
