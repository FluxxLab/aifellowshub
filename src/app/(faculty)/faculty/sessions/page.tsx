import type { Metadata } from "next";
import SessionsView from "@/components/admin/sessions/SessionsView";
import FacultySessionsTour from "@/components/faculty/tours/FacultySessionsTour";
import { getSessionsServer } from "@/lib/api/sessions.server";

/**
 * Faculty live-session view (BRD §6.4 + §6.5).
 *
 * Read-only. Admins schedule sessions and pick a faculty teacher; the
 * backend's `listForAdmin` filters this view to `teacherId === viewer.id`,
 * so faculty only see sessions they're teaching. No Schedule CTA, no row
 * actions — just "what's coming up that I need to deliver."
 *
 * The Zoom alternative_hosts wiring (set at session create) means the
 * faculty teacher can start the meeting straight from this page; admin
 * doesn't need to be online.
 */
export const metadata: Metadata = {
  title: "Sessions · AI Fellows LMS",
  description:
    "Live sessions you're teaching. Admins schedule them; you join and run the room (BRD §6.4).",
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
        description="Admins schedule the cohort's live sessions and add you as the teacher. You'll get a Zoom Start link so you can run the room without admin needing to be online."
      />
    </>
  );
}
