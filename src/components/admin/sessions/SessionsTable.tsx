"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
 Table,
 TableBody,
 TableCell,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import MobileRowCard, {
 MobileRowList,
} from "@/components/ui/table/MobileRowCard";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { MoreDotIcon } from "@/icons";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import type { LiveSession, SessionStatus } from "@/lib/api/sessions";
import RescheduleSessionModal from "./RescheduleSessionModal";
import ReassignHostModal from "./ReassignHostModal";

type SessionsTableProps = {
 sessions: LiveSession[];
};

export default function SessionsTable({ sessions }: SessionsTableProps) {
 if (sessions.length === 0) {
 return (
 <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
 No sessions match.
 </div>
 );
 }

 return (
 <>
 <MobileRowList>
 {sessions.map((s) => (
 <MobileRowCard
 key={s.id}
 header={
 <div>
 <span className="text-xs font-semibold tabular-nums text-fellowship-navy">
 W{String(s.weekNumber).padStart(2, "0")}
 </span>
 <Link
 href={`/sessions/${s.id}`}
 className="mt-0.5 block text-sm font-semibold text-gray-800 hover:text-fellowship-navy"
 >
 {s.title}
 </Link>
 <span className="block truncate text-xs text-gray-500">
 {s.moduleTitle}
 </span>
 </div>
 }
 status={<SessionStatusBadge status={s.status} />}
 meta={
 <div className="flex items-center gap-2">
 <AvatarText name={s.hostName} className="h-7 w-7 text-xs" />
 <span className="truncate">{s.hostName}</span>
 </div>
 }
 stats={[
 {
 label: "When",
 value: (
 <>
 <span className="block">{formatDate(s.scheduledStart)}</span>
 <span className="block text-xs text-gray-500">
 {formatTime(s.scheduledStart)} · {s.durationMinutes}m
 </span>
 </>
 ),
 },
 {
 label:
 s.status === "ended" && s.attendedCount !== undefined
 ? "Attended"
 : "Registered",
 value:
 s.status === "ended" && s.attendedCount !== undefined ? (
 <span className="tabular-nums">
 {s.attendedCount} / {s.expectedCount}
 </span>
 ) : (
 <span className="tabular-nums">{s.rsvpCount}</span>
 ),
 },
 ]}
 actions={<RowActions session={s} />}
 />
 ))}
 </MobileRowList>
 <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white md:block">
 <div className="max-w-full overflow-x-auto">
 <Table>
 <TableHeader className="border-b border-gray-100">
 <TableRow>
 <Th>Week</Th>
 <Th>Title</Th>
 <Th>Host</Th>
 <Th>Date &amp; time</Th>
 <Th>Duration</Th>
 <Th>Registered / Attended</Th>
 <Th>Status</Th>
 <Th right>
 <span className="sr-only">Actions</span>
 </Th>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-gray-100">
 {sessions.map((s) => (
 <TableRow
 key={s.id}
 className="hover:bg-gray-50">
 <Td>
 <span className="text-xs font-semibold tabular-nums text-fellowship-navy">
 W{String(s.weekNumber).padStart(2,"0")}
 </span>
 </Td>
 <Td>
 <Link
 href={`/sessions/${s.id}`}
 className="text-sm font-semibold text-gray-800 hover:text-fellowship-navy">
 {s.title}
 </Link>
 <span className="block text-xs text-gray-500">
 {s.moduleTitle}
 </span>
 </Td>
 <Td>
 <div className="flex items-center gap-2">
 <AvatarText name={s.hostName} className="h-7 w-7 text-xs"/>
 <span className="text-sm text-gray-700">
 {s.hostName}
 </span>
 </div>
 </Td>
 <Td>
 <span className="block text-sm text-gray-700">
 {formatDate(s.scheduledStart)}
 </span>
 <span className="block text-xs text-gray-500">
 {formatTime(s.scheduledStart)}
 </span>
 </Td>
 <Td>
 <span className="text-sm text-gray-700 tabular-nums">
 {s.durationMinutes} min
 </span>
 </Td>
 <Td>
 {s.status ==="ended"&& s.attendedCount !== undefined ? (
 <span className="text-sm text-gray-700 tabular-nums">
 {s.attendedCount} / {s.expectedCount}{" "}
 <span className="text-xs text-gray-500">
 ({Math.round((s.attendedCount / s.expectedCount) * 100)}%)
 </span>
 </span>
 ) : (
 <span className="text-sm text-gray-700 tabular-nums">
 {s.rsvpCount} registered
 </span>
 )}
 </Td>
 <Td>
 <SessionStatusBadge status={s.status} />
 </Td>
 <Td right>
 <RowActions session={s} />
 </Td>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 </div>
 </>
 );
}

function Th({
 children,
 right,
}: {
 children: React.ReactNode;
 right?: boolean;
}) {
 return (
 <TableCell
 isHeader
 className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 sm:px-6 ${
 right ?"text-right":"text-left"}`}
 >
 {children}
 </TableCell>
 );
}

function Td({
 children,
 right,
}: {
 children: React.ReactNode;
 right?: boolean;
}) {
 return (
 <TableCell
 className={`px-5 py-4 sm:px-6 ${right ?"text-right":"text-left"}`}
 >
 {children}
 </TableCell>
 );
}

function SessionStatusBadge({ status }: { status: SessionStatus }) {
 if (status ==="live") return <Badge color="warning">Live</Badge>;
 if (status ==="scheduled") return <Badge color="info">Scheduled</Badge>;
 if (status ==="ended") return <Badge color="success">Ended</Badge>;
 return <Badge color="error">Cancelled</Badge>;
}

function RowActions({ session: s }: { session: LiveSession }) {
 const router = useRouter();
 const { confirm, dialog } = useConfirm();
 const [open, setOpen] = useState(false);
 const [rescheduleOpen, setRescheduleOpen] = useState(false);
 const [reassignOpen, setReassignOpen] = useState(false);
 const sessionId = s.id;
 const status = s.status;

 async function endNow() {
   const ok = await confirm({
     title: "End this session now?",
     message:
       "Everyone in the meeting will be booted. Attendance settles using a proportional threshold so fellows aren't punished for the early end.",
     confirmLabel: "End session",
     tone: "danger",
   });
   if (!ok) return;
   try {
     await apiFetch(`/sessions/${encodeURIComponent(sessionId)}/end`, {
       method: "POST",
     });
     toast.success("Session ended", "Attendance has been settled.");
     router.refresh();
   } catch (err) {
     toast.errorFromException("Couldn't end session", err);
   }
 }

 async function openRecording() {
   try {
     const data = await apiFetch<{ url: string | null }>(
       `/sessions/${encodeURIComponent(sessionId)}/recording-url`,
     );
     if (!data.url) {
       toast.error("Recording isn't ready yet — check back in a few minutes.");
       return;
     }
     window.open(data.url, "_blank", "noopener,noreferrer");
   } catch (err) {
     toast.errorFromException("Couldn't load recording", err);
   }
 }

 async function deleteSession() {
   const ok = await confirm({
     title: "Delete this session permanently?",
     message:
       "The row is removed from the table for good. Attendance history and any cached analytics tied to it go with it. This can't be undone.",
     confirmLabel: "Delete permanently",
     tone: "danger",
   });
   if (!ok) return;
   try {
     await apiFetch(`/sessions/${encodeURIComponent(sessionId)}`, {
       method: "DELETE",
     });
     toast.success("Session deleted");
     router.refresh();
   } catch (err) {
     toast.errorFromException("Couldn't delete session", err);
   }
 }

 async function cancelSession() {
   const ok = await confirm({
     title: "Cancel this session?",
     message:
       "Registered fellows will be notified, the Zoom meeting is removed, and the session disappears from upcoming calendars. The row stays for analytics — use the table's delete action to remove it permanently.",
     confirmLabel: "Cancel session",
     tone: "danger",
   });
   if (!ok) return;
   try {
     await apiFetch(`/sessions/${encodeURIComponent(sessionId)}/cancel`, {
       method: "POST",
     });
     toast.success("Session cancelled");
     router.refresh();
   } catch (err) {
     toast.errorFromException("Couldn't cancel session", err);
   }
 }

 type Action = {
   label: string;
   href?: string;
   onClick?: () => void;
   destructive?: boolean;
 };
 const actions: Action[] = [{ label: "Open", href: `/sessions/${sessionId}` }];
 if (status === "scheduled" || status === "live") {
   if (status === "scheduled") {
     actions.push({ label: "Reschedule", onClick: () => setRescheduleOpen(true) });
     actions.push({ label: "Reassign host", onClick: () => setReassignOpen(true) });
   }
   // "End now" lives above the destructive cancel because it's the
   // common-case action during a live session — host runs out of time
   // or finishes early. Cancel is the rarer "kill the whole session" path.
   if (status === "live") {
     actions.push({ label: "End now", onClick: endNow, destructive: true });
   }
   actions.push({ label: "Cancel session", onClick: cancelSession, destructive: true });
 }
 if (status === "ended") {
   actions.push({ label: "View attendance", href: `/sessions/${sessionId}` });
   if (s.hasRecording) {
     actions.push({ label: "Watch recording", onClick: openRecording });
   }
 }
 if (status === "cancelled") {
   actions.push({ label: "Delete permanently", onClick: deleteSession, destructive: true });
 }

 return (
 <div className="relative inline-block text-left">
 {dialog}
 <button
 type="button" aria-label="Session actions" aria-haspopup="menu" aria-expanded={open}
 onClick={(e) => {
 e.stopPropagation();
 setOpen((v) => !v);
 }}
 className="dropdown-toggle inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800">
 <MoreDotIcon className="h-5 w-5"/>
 </button>
 {/*
   Portal-rendered: this row sits inside an overflow-hidden +
   overflow-x-auto wrapper. Without the portal, the menu would clip
   against those boundaries (see /sessions list page screenshot).
 */}
 <Dropdown
 isOpen={open}
 onClose={() => setOpen(false)}
 portal
 className="w-48 p-1">
 <ul role="menu" className="flex flex-col gap-0.5">
 {actions.map((a, i) => (
 <li key={i} role="none">
 <DropdownItem
 tag={a.href ?"a":"button"}
 href={a.href}
 onItemClick={() => {
   setOpen(false);
   a.onClick?.();
 }}
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
 <RescheduleSessionModal
 isOpen={rescheduleOpen}
 onClose={() => setRescheduleOpen(false)}
 sessionId={sessionId}
 sessionTitle={s.title}
 currentStartsAt={s.scheduledStart}
 currentDurationMinutes={s.durationMinutes}
 />
 <ReassignHostModal
 isOpen={reassignOpen}
 onClose={() => setReassignOpen(false)}
 sessionId={sessionId}
 sessionTitle={s.title}
 currentHostId={s.hostId}
 />
 </div>
 );
}

function formatDate(iso: string): string {
 return new Date(iso).toLocaleDateString(undefined, {
 weekday:"short",
 month:"short",
 day:"numeric",
 });
}
function formatTime(iso: string): string {
 return new Date(iso).toLocaleTimeString(undefined, {
 hour:"numeric",
 minute:"2-digit",
 });
}
