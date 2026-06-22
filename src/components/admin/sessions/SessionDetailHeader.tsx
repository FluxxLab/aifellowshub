"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { CalenderIcon, ChevronLeftIcon, MoreDotIcon } from "@/icons";
import type { AttendanceRecord, SessionDetail, SessionStatus } from "@/lib/api/sessions";

// Lazy-loaded so the ~3MB Zoom Meeting SDK bundle stays out of the admin
// list view. SSR off because the SDK reaches for `window` on import.
// Reused from the fellow tree — the backend's `issueZoomSignature` mints
// a host-role token (role=1) for admins/faculty automatically.
const ZoomMeetingRoom = dynamic(
  () => import("@/components/fellow/ZoomMeetingRoom"),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-gray-300">Loading meeting…</p>
    ),
  },
);

export default function SessionDetailHeader({
 session,
}: {
 session: SessionDetail;
}) {
 const [menuOpen, setMenuOpen] = useState(false);
 const [meetingOpen, setMeetingOpen] = useState(false);

 const startsAt = new Date(session.scheduledStart);
 const dateLabel = startsAt.toLocaleDateString(undefined, {
 timeZone: "Africa/Lagos",
 weekday:"long",
 month:"long",
 day:"numeric",
 year:"numeric",
 });
 const timeLabel = startsAt.toLocaleTimeString(undefined, {
 timeZone: "Africa/Lagos",
 hour:"numeric",
 minute:"2-digit",
 });

 const actions = buildActions(session.status, session.title, session.attendance);

 return (
 <div className="flex flex-col gap-4">
 <Link
 href="/sessions" className="inline-flex w-fit items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700">
 <ChevronLeftIcon className="h-4 w-4"/>
 Back to sessions
 </Link>

 <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
 <div className="flex-1">
 <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-fellowship-navy">
 Week {session.weekNumber}
 </p>
 <h1 className="text-title-sm font-bold text-gray-800 sm:text-title-md">
 {session.title}
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 {session.moduleTitle}
 </p>

 <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-gray-600">
 <span className="inline-flex items-center gap-2">
 <CalenderIcon className="h-4 w-4"/>
 {dateLabel} · {timeLabel}
 </span>
 <span className="tabular-nums">{session.durationMinutes} min</span>
 <span className="inline-flex items-center gap-2">
 <AvatarText name={session.hostName} className="h-6 w-6 text-xs"/>
 Hosted by {session.hostName}
 </span>
 {session.teachers.length > 0 && (
 <span className="inline-flex items-center gap-2">
 <AvatarText
 name={session.teachers[0].fullName}
 className="h-6 w-6 text-xs"
 />
 Taught by {session.teachers.map((t) => t.fullName).join(", ")}
 </span>
 )}
 <SessionStatusBadge status={session.status} />
 </div>
 </div>

 <div className="flex shrink-0 items-center gap-2">
 {(session.status ==="scheduled"|| session.status ==="live") && (
 <span
 title={
 session.zoomMeetingId
 ?"Starts the Zoom meeting in-app. Fellows who join also see the meeting embedded in the LMS."
 :"No Zoom meeting linked to this session yet. Edit the session to provision one."}
 >
 <Button
 variant="fellowship" size="sm" disabled={!session.zoomMeetingId}
 onClick={() => setMeetingOpen(true)}
 >
 Start session
 </Button>
 </span>
 )}
 {actions.length > 0 && (
 <div className="relative">
 <button
 type="button" aria-label="Session actions" aria-haspopup="menu" aria-expanded={menuOpen}
 onClick={() => setMenuOpen((v) => !v)}
 className="dropdown-toggle inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50">
 <MoreDotIcon className="h-5 w-5"/>
 </button>
 <Dropdown
 isOpen={menuOpen}
 onClose={() => setMenuOpen(false)}
 className="w-48 p-1">
 <ul role="menu" className="flex flex-col gap-0.5">
 {actions.map((a, i) => (
 <li key={i} role="none">
 <DropdownItem
 onItemClick={() => { a.onClick?.(); setMenuOpen(false); }}
 baseClassName="block w-full rounded-md text-left px-3 py-2 text-sm font-medium transition-colors" className={
 a.destructive
 ?"text-error-600 hover:bg-error-50":"text-gray-700 hover:bg-gray-100 hover:text-gray-900"}
 >
 {a.label}
 </DropdownItem>
 </li>
 ))}
 </ul>
 </Dropdown>
 </div>
 )}
 </div>
 </div>

 {/* Inline meeting card — drops into the page flow below the header
     instead of overlaying the whole viewport. The attendance roster
     stays visible underneath, so admins can monitor RSVPs while the
     meeting runs without window-switching. */}
 {meetingOpen && (
 <div className="rounded-2xl border border-gray-200 bg-gray-900 p-4 sm:p-5">
 <div className="mb-3 flex items-center justify-between text-white">
 <h2 className="text-sm font-semibold">{session.title} — Live</h2>
 <Button
 size="sm"
 variant="outline"
 onClick={() => setMeetingOpen(false)}
 >
 Close meeting
 </Button>
 </div>
 <ZoomMeetingRoom
 sessionId={session.id}
 onLeave={() => setMeetingOpen(false)}
 />
 </div>
 )}
 </div>
 );
}

function buildActions(
  status: SessionStatus,
  sessionTitle: string,
  attendance: AttendanceRecord[],
): { label: string; destructive?: boolean; onClick?: () => void }[] {
  if (status === "scheduled" || status === "live") {
    return [
      { label: "Reschedule" },
      { label: "Reassign host" },
      { label: "Cancel session", destructive: true },
    ];
  }
  if (status === "ended") {
    return [
      {
        label: "Export attendance CSV",
        onClick: () => exportAttendanceCSV(sessionTitle, attendance),
      },
    ];
  }
  return [];
}

/**
 * Final attendance status for export — mirrors `finalStatusOf` in
 * AttendanceRoster so the CSV matches exactly what the admin sees on screen.
 * Precedence: admin overrides win, then live presence, then recording credit.
 */
function exportStatusLabel(r: AttendanceRecord): string {
  if (r.override === "attended") return "Attended";
  if (r.override === "excused") return "Excused";
  if (r.inSession) return "In session";
  if (r.autoCredited) return "Attended";
  if (r.recordingCreditedAt) return "Attended (recording)";
  return "Missed";
}

function exportAttendanceCSV(
  sessionTitle: string,
  attendance: AttendanceRecord[],
): void {
  const header = [
    "Fellow Name",
    "Joined At",
    "Left At",
    "Minutes Present",
    "Status",
    "Auto-credited",
    "Recording Watched (min)",
    "Recording Credit",
    "Override",
  ];

  const rows = attendance.map((r) => {
    return [
      r.fellowName,
      r.joinedAt
        ? new Date(r.joinedAt).toLocaleString(undefined, { timeZone: "Africa/Lagos" })
        : "",
      r.leftAt
        ? new Date(r.leftAt).toLocaleString(undefined, { timeZone: "Africa/Lagos" })
        : "",
      String(r.totalMinutesPresent),
      exportStatusLabel(r),
      r.autoCredited ? "Yes" : "No",
      String(Math.round((r.recordingWatchedSeconds ?? 0) / 60)),
      r.recordingCreditedAt ? "Yes (half-credit)" : "No",
      r.override ?? "",
    ];
  });

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safe = sessionTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  a.href = url;
  a.download = `attendance-${safe}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function SessionStatusBadge({ status }: { status: SessionStatus }) {
 if (status ==="live") return <Badge color="warning">Live</Badge>;
 if (status ==="scheduled") return <Badge color="info">Scheduled</Badge>;
 if (status ==="ended") return <Badge color="success">Ended</Badge>;
 return <Badge color="error">Cancelled</Badge>;
}
