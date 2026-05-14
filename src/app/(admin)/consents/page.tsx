import type { Metadata } from "next";
import ConsentsView from "@/components/admin/consents/ConsentsView";
import { listFellowConsentsServer } from "@/lib/api/consents.server";

export const metadata: Metadata = {
  title: "Fellow consents · AI Fellows LMS",
  description:
    "Admin view of every fellow's Code of Conduct and Data Protection acceptance.",
};

export default async function ConsentsPage() {
  const initial = await listFellowConsentsServer();
  return <ConsentsView initial={initial} />;
}
