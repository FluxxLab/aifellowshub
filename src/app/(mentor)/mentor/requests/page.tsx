import type { Metadata } from "next";
import MentorRequestsView from "@/components/mentor/MentorRequestsView";
import MentorRequestsTour from "@/components/mentor/tours/MentorRequestsTour";
import { listMentorBookingsServer } from "@/lib/api/mentorship.server";
import { getMentorQueueServer } from "@/lib/api/mentor-capstone.server";

export const metadata: Metadata = {
  title: "Coaching requests · AI Fellows LMS",
  description:
    "Incoming coaching requests from fellows. Accept or decline; admin approves the time slot afterwards.",
};

export default async function MentorRequestsPage() {
  const [bookings, queue] = await Promise.all([
    listMentorBookingsServer(),
    getMentorQueueServer(),
  ]);
  // Strip queue down to the fields the schedule modal needs — name + id.
  const fellows = queue.map((q) => ({
    id: q.fellowId,
    fullName: q.fellowName,
  }));
  return (
    <>
      <MentorRequestsTour />
      <MentorRequestsView initialBookings={bookings} fellows={fellows} />
    </>
  );
}
