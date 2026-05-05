import React from "react";
import Link from "next/link";
import { CalenderIcon, ChevronRightIcon, GroupIcon } from "@/icons";
import type { UpcomingSession } from "@/lib/api/dashboard";

type UpcomingSessionsProps = {
 sessions: UpcomingSession[];
};

export default function UpcomingSessions({ sessions }: UpcomingSessionsProps) {
 return (
 <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
 <div className="mb-4 flex items-start justify-between">
 <div>
 <h3 className="text-lg font-semibold text-gray-800">
 Upcoming sessions
 </h3>
 <p className="mt-1 text-sm text-gray-500">
 Next 7 days
 </p>
 </div>
 <Link
 href="/sessions" className="inline-flex items-center gap-1 text-sm font-semibold text-fellowship-navy hover:text-fellowship-navy-dark">
 View all
 <ChevronRightIcon className="h-4 w-4"/>
 </Link>
 </div>

 {sessions.length === 0 ? (
 <EmptyState />
 ) : (
 <ul className="flex flex-col gap-3">
 {sessions.map((s) => (
 <SessionRow key={s.id} session={s} />
 ))}
 </ul>
 )}
 </div>
 );
}

function SessionRow({ session }: { session: UpcomingSession }) {
 const startsAt = new Date(session.startsAt);
 const dateLabel = startsAt.toLocaleDateString(undefined, {
 weekday:"short",
 month:"short",
 day:"numeric",
 });
 const timeLabel = startsAt.toLocaleTimeString(undefined, {
 hour:"numeric",
 minute:"2-digit",
 });

 return (
 <li className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning-100 text-fellowship-navy">
 <CalenderIcon className="h-5 w-5"/>
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <span className="text-xs font-semibold uppercase tracking-wider text-fellowship-navy">
 Week {session.weekNumber}
 </span>
 <span className="text-xs text-gray-400">·</span>
 <span className="text-xs text-gray-500">
 {session.durationMinutes} min
 </span>
 </div>
 <p className="mt-0.5 truncate text-sm font-semibold text-gray-800">
 {session.moduleTitle}
 </p>
 <div className="mt-1 flex items-center justify-between gap-3 text-xs text-gray-500">
 <span className="truncate">
 {dateLabel} · {timeLabel}
 </span>
 <span className="inline-flex shrink-0 items-center gap-1">
 <GroupIcon className="h-3.5 w-3.5"/>
 {session.rsvpCount}
 </span>
 </div>
 <p className="mt-0.5 truncate text-xs text-gray-400">
 Hosted by {session.host}
 </p>
 </div>
 </li>
 );
}

function EmptyState() {
 return (
 <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-6 text-center">
 <CalenderIcon className="mb-3 h-8 w-8 text-gray-300"/>
 <p className="text-sm text-gray-500">
 No sessions scheduled in the next 7 days.
 </p>
 <Link
 href="/sessions" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-fellowship-navy hover:text-fellowship-navy-dark">
 Schedule a session
 <ChevronRightIcon className="h-4 w-4"/>
 </Link>
 </div>
 );
}
