import type { Metadata } from "next";
import CapstoneOversight from "@/components/admin/capstone/CapstoneOversight";
import AdminCapstoneTour from "@/components/admin/tours/CapstoneTour";
import { getCapstoneSubmissionsServer } from "@/lib/api/capstone.server";

export const metadata: Metadata = {
  title: "Capstone · AI Fellows LMS",
  description:
    "Cohort capstone oversight (BRD §6.10). Track mentor reviews and flag overdue submissions.",
};

export default async function CapstonePage() {
  const submissions = await getCapstoneSubmissionsServer();
  return (
    <>
      <AdminCapstoneTour />
      <CapstoneOversight submissions={submissions} />
    </>
  );
}
