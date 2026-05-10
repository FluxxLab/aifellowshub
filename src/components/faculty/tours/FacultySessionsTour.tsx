"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

/**
 * First-visit tour for `/faculty/sessions`. Faculty see only sessions
 * where they're named as the teacher (the backend filters on
 * `teacherId === viewer.id`); admins see the cohort-wide list.
 */
export default function FacultySessionsTour() {
  const steps: DriveStep[] = [
    {
      element: "h1",
      popover: {
        title: "Sessions you're teaching",
        description:
          "Every session an admin has assigned you to as the teacher. This is your read-only view — admins schedule, edit times, or cancel.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "h1",
      popover: {
        title: "Joining is one click",
        description:
          "When it's time, click into the session and press Join. The room is already open (admin's Zoom hosts it) so you walk straight in — no extra setup.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "h1",
      popover: {
        title: "Recordings, if you missed live",
        description:
          "Once a session ends, the Zoom cloud recording is pulled to DigitalOcean Spaces. Fellows can earn half-credit by watching the full recording — useful context if you want to know who caught up.",
        side: "bottom",
        align: "start",
      },
    },
  ];

  return <Tour pageKey="faculty-sessions" steps={steps} />;
}
