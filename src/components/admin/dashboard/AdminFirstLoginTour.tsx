"use client";
import type { DriveStep } from "driver.js";
import Tour from "@/components/ui/tour/Tour";

type Props = {
  firstName: string;
};

/**
 * Admin / super-admin first-login tour. Mounted by the admin dashboard
 * page only when `currentUser.hasSeenTour === false` and the user's role
 * is admin/super-admin. Anchors target `data-tour="…"` attributes on the
 * dashboard sections.
 */
export default function AdminFirstLoginTour({ firstName }: Props) {
  const steps: DriveStep[] = [
    {
      element: '[data-tour="dashboard-metrics"]',
      popover: {
        title: `Welcome, ${firstName}`,
        description:
          "These four numbers are the programme's pulse: active fellows, average progress, attendance, and capstones in review. Trends compare against the previous 7 days.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="cohort-progress"]',
      popover: {
        title: "Cohort progress",
        description:
          "Week-by-week module completion across the cohort. Use it to spot the weeks where fellows stall — that's usually a signal to follow up with mentors.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="upcoming-sessions"]',
      popover: {
        title: "Upcoming live sessions",
        description:
          "Schedule, registrations, and host info live here. Click any session to see the attendance roster or override credit manually.",
        side: "left",
        align: "start",
      },
    },
    {
      element: '[data-tour="at-risk"]',
      popover: {
        title: "At-risk fellows",
        description:
          "Fellows below the progress or attendance threshold land here so you can intervene early. Each row links to a profile with assessments, sessions, and capstone status.",
        side: "top",
        align: "center",
      },
    },
    {
      element: 'a[href="/settings"]',
      popover: {
        title: "Programme levers",
        description:
          "Cohort capacity, registration window, notification defaults, and the auto-credit threshold all live in Settings. You can change them any time.",
        side: "bottom",
        align: "end",
      },
    },
  ];

  return <Tour pageKey="admin-dashboard" steps={steps} />;
}
