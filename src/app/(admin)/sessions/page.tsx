import type { Metadata } from "next";
import SessionsView from "@/components/admin/sessions/SessionsView";
import SessionsTour from "@/components/admin/tours/SessionsTour";
import { getSessionsServer } from "@/lib/api/sessions.server";

export const metadata: Metadata = {
  title: "Sessions · AI Fellows LMS",
  description:
    "Schedule and manage live sessions across the cohort (BRD §6.4). Live-only — no recordings.",
};

export default async function SessionsPage() {
  const sessions = await getSessionsServer();

  return (
    <>
      <SessionsTour />
      <SessionsView sessions={sessions} />
    </>
  );
}
