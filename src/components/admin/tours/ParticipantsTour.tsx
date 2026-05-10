"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/** First-visit tour for `/participants` (BRD §6.2). */
export default function ParticipantsTour() {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="participants-heading"]',
      popover: {
        title: "Participants",
        description:
          "Every fellow, faculty member, mentor, and admin in the programme — plus the registration waitlist — lives here.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="participants-invite"]',
      popover: {
        title: "Invite the team",
        description:
          "Use this to bring on faculty, mentors, or co-admins. Each invite generates a temp password the user must change on first login.",
        side: "left",
        align: "start",
      },
    },
    {
      element: '[role="tablist"]',
      popover: {
        title: "Switch the audience",
        description:
          "Tabs swap the table between fellows, faculty, mentors, admins, and the waitlist. Counts update live as roles change.",
        side: "bottom",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="admin-participants" steps={steps} />;
}
