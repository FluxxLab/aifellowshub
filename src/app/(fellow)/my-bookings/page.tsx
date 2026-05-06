import type { Metadata } from "next";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import FellowBookingsList from "@/components/fellow/FellowBookingsList";
import { listFellowBookingsServer } from "@/lib/api/mentorship.server";

export const metadata: Metadata = {
  title: "My bookings · AI Fellows LMS",
  description:
    "Track your mentorship requests and join confirmed sessions.",
};

export default async function MyBookingsPage() {
  const bookings = await listFellowBookingsServer();
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/home" }, { label: "My bookings" }]} />
      <div>
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          My bookings
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Pending requests are awaiting admin approval. Once confirmed,
          you&apos;ll see the Zoom join link here.
        </p>
      </div>
      <FellowBookingsList initialBookings={bookings} />
    </div>
  );
}
