import type { Metadata } from "next";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import FellowMentorshipView from "@/components/fellow/FellowMentorshipView";
import {
  getMyAssignedMentorServer,
  listFellowBookingsServer,
} from "@/lib/api/mentorship.server";

export const metadata: Metadata = {
  title: "Mentorship sessions · AI Fellows LMS",
  description:
    "Request a 1:1 mentorship session and track its status — from your mentor accepting through admin approval and the live Zoom call.",
};

/**
 * Combined fellow page (BRD §6.10 extension):
 *   - Top: "Request a session" form, pre-bound to their sector-matched
 *     mentor. No mentor browsing — assignment is automatic.
 *   - Below: history of their existing requests with status tracking.
 */
export default async function MentorshipSessionsPage() {
  const [assigned, bookings] = await Promise.all([
    getMyAssignedMentorServer(),
    listFellowBookingsServer(),
  ]);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Mentorship sessions" },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          Mentorship sessions
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Your sector mentor is assigned by an admin. Propose a time below;
          your mentor accepts or declines, then an admin confirms and you
          get the Zoom link.
        </p>
      </div>
      <FellowMentorshipView assigned={assigned} initialBookings={bookings} />
    </div>
  );
}
