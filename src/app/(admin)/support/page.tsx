import type { Metadata } from "next";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import AdminSupportView from "@/components/admin/support/AdminSupportView";
import { listAdminSupportTicketsServer } from "@/lib/api/support.server";

export const metadata: Metadata = {
 title: "Support · AI Fellows LMS",
 description:
 "Triage and respond to support tickets from fellows, mentors, and faculty.",
};

export default async function AdminSupportPage() {
 const tickets = await listAdminSupportTicketsServer();
 return (
 <div className="flex flex-col gap-4 md:gap-6">
 <Breadcrumbs items={[{ label: "Support" }]} />
 <div>
 <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
 Support
 </h1>
 <p className="mt-2 max-w-2xl text-gray-600">
 In-app tickets from fellows, mentors, and faculty. Reply inline;
 reopened tickets jump back to the top of the queue.
 </p>
 </div>
 <AdminSupportView initial={tickets} />
 </div>
 );
}
