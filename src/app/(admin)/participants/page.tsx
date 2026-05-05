import type { Metadata } from "next";
import { Suspense } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ParticipantsList from "@/components/admin/participants/ParticipantsList";
import { getParticipantsServer } from "@/lib/api/participants.server";

export const metadata: Metadata = {
  title: "Participants · AI Fellows LMS",
  description:
    "Manage fellows, mentors, admins, and the cohort waitlist (BRD §6.2).",
};

export default async function ParticipantsPage() {
  const data = await getParticipantsServer();

  return (
    <>
      <PageBreadcrumb pageTitle="Participants" />
      <Suspense fallback={null}>
        <ParticipantsList data={data} />
      </Suspense>
    </>
  );
}
