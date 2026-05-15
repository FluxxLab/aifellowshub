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

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ZoomSdkPrefetch />
      
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

      <div className="rounded-2xl border border-gray-200 bg-gray-900 p-4 sm:p-5">
        <ZoomMeetingRoom sessionId={session.id!} />
      </div>
    </div>
  );
}
