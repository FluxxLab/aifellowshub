"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

type Props = {
  firstName: string;
};

/**
 * Fellow first-login tour (BRD §6.1). Mounted by the fellow home page
 * only when `currentUser.hasSeenTour === false`. Anchors target
 * `data-tour="…"` attributes on the page.
 */
export default function FirstLoginTour({ firstName }: Props) {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="welcome"]',
      popover: {
        title: `Welcome, ${firstName} 👋`,
        description:
          "This is your fellowship hub. Here's a quick tour — 30 seconds — so you know where everything lives.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="continue-learning"]',
      popover: {
        title: "Pick up where you left off",
        description:
          "Your current module sits here. The progress bar reflects lessons done; the buttons take you straight back to the curriculum.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="next-session"]',
      popover: {
        title: "Your next live session",
        description:
          "Register from here, then join via the LMS — no Zoom app needed. Miss one? Pass the assessment or watch the recording to still complete the module.",
        side: "left",
        align: "start",
      },
    },
    {
      element: '[data-tour="ai-buddy"]',
      popover: {
        title: "AI Buddy — your study companion",
        description:
          "Stuck on a concept or scoping your capstone? Ask AI Buddy. You get 20 messages a day, resets at midnight UTC.",
        side: "bottom",
        align: "center",
      },
    },
  ];

  return <Tour pageKey="home" steps={steps} />;
}
