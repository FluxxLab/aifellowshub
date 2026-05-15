import type { Metadata } from "next";
import { Suspense } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ParticipantsList from "@/components/admin/participants/ParticipantsList";
import ParticipantsTour from "@/components/admin/tours/ParticipantsTour";
import { getParticipantsServer } from "@/lib/api/participants.server";

export const metadata: Metadata = {
  title: "Participants · AI Fellows LMS",
  description:
    "Manage fellows, mentors, admins, and the cohort waitlist (BRD §6.2).",
};

// Force per-request rendering. The participants list reflects the
// live state of the user table — wiped via reset-fellows.cjs,
// re-populated via bulk-invite-fellows.cjs, edited inline from this
// page itself. Without force-dynamic, Next.js can serve a stale
// render after a reset and admins click rows whose IDs no longer
// exist in the DB, hitting a confusing 404 on the detail page.
export const dynamic = "force-dynamic";

export default async function ParticipantsPage() {
  const data = await getParticipantsServer();

  return (
    <>
      <ParticipantsTour />
      <PageBreadcrumb pageTitle="Participants" />
      <Suspense fallback={null}>
        <ParticipantsList data={data} />
      </Suspense>
    </>
  );
}
