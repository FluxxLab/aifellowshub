import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getFellowSessionsServer } from "@/lib/api/fellow-learning.server";
import { ChevronLeftIcon } from "@/icons";
import ZoomSdkPrefetch from "@/components/fellow/ZoomSdkPrefetch";
import dynamic from "next/dynamic";

const ZoomMeetingRoom = dynamic(
  () => import("@/components/fellow/ZoomMeetingRoom"),
  {
    ssr: false,
    loading: () => <p className="text-sm text-gray-500">Loading meeting…</p>,
  }
);

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const sessions = await getFellowSessionsServer();
  const session = sessions.find((s) => s.id === params.id);
  return {
    title: session ? `${session.title || 'Session'} · Live Meeting` : "Session not found",
  };
}

export default async function FellowSessionMeetingPage({
  params,
}: {
  params: { id: string };
}) {
  const sessions = await getFellowSessionsServer();
  const session = sessions.find((s) => s.id === params.id);
  
  if (!session) notFound();

  const startsAtMs = new Date(session.startsAt).getTime();
  const earlyOpenMs = startsAtMs - 15 * 60_000;
  const isLive =
    session.status === "live" ||
    (session.status === "upcoming" && Date.now() >= earlyOpenMs);
  const isEnded = session.status === "ended" || session.status === "cancelled";

  const joinCutoffMs =
    new Date(session.startsAt).getTime() +
    session.attendanceThresholdMinutes * 60_000;
  const hasJoinedBefore = Boolean(session.joinedAt);
  // Block only first-time joiners past the cutoff. Fellows who already
  // joined before the window closed can rejoin freely (connection drops, etc).
  const blocked = isLive && Date.now() > joinCutoffMs && !hasJoinedBefore;

  const scheduledTime =
    new Date(session.startsAt).toLocaleString("en-NG", {
      timeZone: "Africa/Lagos",
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }) + " WAT";

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {isLive && !blocked && <ZoomSdkPrefetch />}

      <Link
        href="/my-sessions" className="inline-flex w-fit items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700">
        <ChevronLeftIcon className="h-4 w-4"/>
        Back to sessions
      </Link>

      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-fellowship-navy">
            Week {session.weekNumber}
          </p>
          <h1 className="text-title-sm font-bold text-gray-800 sm:text-title-md">
            {session.title || "Live session"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {session.moduleTitle}
          </p>
        </div>
      </div>

      {!isLive && !isEnded && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <svg className="h-7 w-7 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-bold text-gray-800">Session hasn&apos;t started yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
            This session is scheduled for <span className="font-semibold text-gray-700">{scheduledTime}</span>.
            Come back then and this page will let you join.
          </p>
          <Link href="/my-sessions" className="mt-6 inline-flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <ChevronLeftIcon className="h-4 w-4" />
            Back to sessions
          </Link>
        </div>
      )}

      {isEnded && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <h2 className="text-lg font-bold text-gray-800">Session has ended</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
            This session is no longer active. Your attendance has been recorded.
          </p>
          <Link href="/my-sessions" className="mt-6 inline-flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <ChevronLeftIcon className="h-4 w-4" />
            Back to sessions
          </Link>
        </div>
      )}

      {isLive && blocked && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <h2 className="mt-4 text-lg font-bold text-gray-800">
            Join window has closed
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
            The {session.attendanceThresholdMinutes}-minute join window for this session has passed.
            Contact your facilitator if you believe this is an error.
          </p>
          <Link href="/my-sessions" className="mt-6 inline-flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <ChevronLeftIcon className="h-4 w-4" />
            Back to sessions
          </Link>
        </div>
      )}

      {isLive && !blocked && (
        <div className="relative min-h-[72vh] rounded-2xl border border-gray-200 bg-gray-900 p-3">
          <ZoomMeetingRoom sessionId={session.id!} />
        </div>
      )}
    </div>
  );
}
