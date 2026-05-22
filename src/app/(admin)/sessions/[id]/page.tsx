import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SessionDetailHeader from "@/components/admin/sessions/SessionDetailHeader";
import AttendanceRoster from "@/components/admin/sessions/AttendanceRoster";
import AiAttendanceReport from "@/components/admin/sessions/AiAttendanceReport";
import { getSession } from "@/lib/api/sessions";
import { getSessionAdminServer } from "@/lib/api/sessions.server";

type PageProps = {
  params: { id: string };
};

/** Fetch real backend roster first; fall back to mock if unreachable. */
async function loadSession(id: string) {
  const real = await getSessionAdminServer(id);
  if (real) return real;
  return getSession(id);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = params;
  const session = await loadSession(id);
  return {
    title: session
      ? `${session.title} · Sessions`
      : "Session · AI Fellows LMS",
  };
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = params;
  const session = await loadSession(id);
  if (!session) notFound();

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <SessionDetailHeader session={session} />
      <AttendanceRoster sessionId={session.id} session={session} />
      {session.status === "ended" && (
        <AiAttendanceReport sessionId={session.id} />
      )}
    </div>
  );
}
