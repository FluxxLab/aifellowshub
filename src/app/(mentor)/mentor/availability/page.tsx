import type { Metadata } from "next";
import MentorAvailabilityView from "@/components/mentor/MentorAvailabilityView";
import {
  listMentorBookingsServer,
  listMentorSlotsServer,
} from "@/lib/api/mentorship.server";

export const metadata: Metadata = {
  title: "Availability · AI Fellows LMS",
  description:
    "Publish 1:1 availability for fellows to book. Approval is handled by an admin who hosts the meeting.",
};

export default async function MentorAvailabilityPage() {
  const [slots, bookings] = await Promise.all([
    listMentorSlotsServer(),
    listMentorBookingsServer(),
  ]);
  return <MentorAvailabilityView initialSlots={slots} initialBookings={bookings} />;
}
