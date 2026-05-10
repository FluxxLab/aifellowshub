import type { Metadata } from "next";
import MentorRequestsView from "@/components/mentor/MentorRequestsView";
import MentorRequestsTour from "@/components/mentor/tours/MentorRequestsTour";
import { listMentorBookingsServer } from "@/lib/api/mentorship.server";

export const metadata: Metadata = {
  title: "Coaching requests · AI Fellows LMS",
  description:
    "Incoming coaching requests from fellows. Accept or decline; admin approves the time slot afterwards.",
};

export default async function MentorRequestsPage() {
  const bookings = await listMentorBookingsServer();
  return (
    <>
      <MentorRequestsTour />
      <MentorRequestsView initialBookings={bookings} />
    </>
  );
}
