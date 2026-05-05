"use client";
import React, { useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventInput, EventClickArg } from "@fullcalendar/core";
import type { LiveSession, SessionStatus } from "@/lib/api/sessions";
import { useRouter } from "next/navigation";

type SessionsCalendarProps = {
 sessions: LiveSession[];
};

/** Map session status → calendar event class (drives bg color via globals.css`.event-fc-color`). */
const STATUS_CLASS: Record<SessionStatus, string> = {
 scheduled:"event-fc-color fc-bg-primary",
 live:"event-fc-color fc-bg-warning",
 ended:"event-fc-color fc-bg-success",
 cancelled:"event-fc-color fc-bg-danger",
};

export default function SessionsCalendar({ sessions }: SessionsCalendarProps) {
 const router = useRouter();

 const events: EventInput[] = useMemo(
 () =>
 sessions.map((s) => ({
 id: s.id,
 title: s.title,
 start: s.scheduledStart,
 end: s.scheduledEnd,
 classNames: STATUS_CLASS[s.status],
 extendedProps: { status: s.status, host: s.hostName, week: s.weekNumber },
 })),
 [sessions]
 );

 const handleClick = (arg: EventClickArg) => {
 router.push(`/sessions/${arg.event.id}`);
 };

 return (
 <div className="rounded-2xl border border-gray-200 bg-white p-2 sm:p-4">
 <FullCalendar
 plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
 initialView="dayGridMonth" headerToolbar={{
 left:"prev,next today",
 center:"title",
 right:"dayGridMonth,timeGridWeek,timeGridDay",
 }}
 height="auto" events={events}
 eventClick={handleClick}
 nowIndicator
 dayMaxEvents={3}
 />
 <Legend />
 </div>
 );
}

function Legend() {
 return (
 <div className="mt-3 flex flex-wrap items-center gap-4 px-2 pb-2 text-xs text-gray-500">
 <LegendDot className="bg-brand-500" label="Scheduled"/>
 <LegendDot className="bg-warning-500" label="Live"/>
 <LegendDot className="bg-success-500" label="Ended"/>
 <LegendDot className="bg-error-500" label="Cancelled"/>
 </div>
 );
}

function LegendDot({ className, label }: { className: string; label: string }) {
 return (
 <span className="inline-flex items-center gap-1.5">
 <span className={`h-2 w-2 rounded-full ${className}`} />
 {label}
 </span>
 );
}
