import type { Metadata } from "next";
import SessionsView from "@/components/admin/sessions/SessionsView";
import FacultySessionsTour from "@/components/faculty/tours/FacultySessionsTour";
import { getSessionsServer } from "@/lib/api/sessions.server";

/**
 * Faculty live-session view (BRD §6.4 + §6.5).
 *
 * Read-only. Admins schedule sessions and assign a faculty teacher; the
 * backend's `listForAdmin` filters this view to `teacherId === viewer.id`,
 * so faculty only see sessions they're teaching. No Schedule CTA, no row
 * actions — just "what's coming up that I need to deliver."
 *
 * Faculty join the meeting like any other participant via the LMS embed
 * (`join_before_host: true` lets them in before the admin host arrives).
 * The teacher field is an LMS-only assignment for awareness + scoping;
 * Zoom hosting stays with the admin.
 */
export const metadata: Metadata = {
  title: "Sessions · AI Fellows LMS",
  description:
    "Live sessions you're teaching. Admins schedule them; you join from this page when it's time (BRD §6.4).",
};

export default async function FacultySessionsPage() {
  const sessions = await getSessionsServer();
  return (
    <>
      <FacultySessionsTour />
      <SessionsView
        sessions={sessions}
        readOnly
        heading="Sessions you're teaching"
        description="Admins schedule the cohort's live sessions and assign you as the teacher. Join from here when it's time — no extra setup needed."
      />
    </>
  );
}
