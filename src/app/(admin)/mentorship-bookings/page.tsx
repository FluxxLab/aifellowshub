import type { Metadata } from "next";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import AdminBookingsView from "@/components/admin/mentorship/AdminBookingsView";
import { listAdminBookingsServer } from "@/lib/api/mentorship.server";

export const metadata: Metadata = {
  title: "Mentorship bookings · AI Fellows LMS",
  description:
    "Approve mentorship requests. The approving admin becomes the Zoom host.",
};

export default async function AdminMentorshipBookingsPage() {
  const bookings = await listAdminBookingsServer();
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/dashboard" }, { label: "Mentorship bookings" }]} />
      <div>
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          Mentorship bookings
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Fellows request 1:1 sessions with mentors. Approving here creates
          the Zoom meeting under your email — you&apos;re the host.
        </p>
      </div>
      <AdminBookingsView initialBookings={bookings} />
    </div>
  );
}
