import type { Metadata } from "next";
import SessionsView from "@/components/admin/sessions/SessionsView";
import FacultySessionsTour from "@/components/faculty/tours/FacultySessionsTour";
import { getSessionsServer } from "@/lib/api/sessions.server";

/**
 * Faculty live-session view (BRD §6.4 + §6.5).
 *
 * Reuses the admin `SessionsView` because the data shape and operator
 * actions are identical — schedule, edit, end early, view roster. The
 * backend's `listForAdmin` already scopes the response by ownership for
 * non-admin roles (`module.course.ownerId === viewer.userId`), so this
 * page renders only sessions on the faculty member's own modules
 * without any client-side filtering.
 */
export const metadata: Metadata = {
  title: "Sessions · AI Fellows LMS",
  description:
    "Live sessions on your modules — schedule, edit, end, or roster (BRD §6.4).",
};

export default async function FacultySessionsPage() {
  const sessions = await getSessionsServer();
  return (
    <>
      <FacultySessionsTour />
      <SessionsView sessions={sessions} />
    </>
  );
}
