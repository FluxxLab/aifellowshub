"use client";
import React, { useState } from "react";
import Link from "next/link";
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
import { MoreDotIcon } from "@/icons";
import type { LiveSession, SessionStatus } from "@/lib/api/sessions";

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
 : "RSVPs",
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
 actions={<RowActions sessionId={s.id} status={s.status} />}
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
 <Th>RSVPs / Attended</Th>
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
 {s.rsvpCount} RSVPs
 </span>
 )}
 </Td>
 <Td>
 <SessionStatusBadge status={s.status} />
 </Td>
 <Td right>
 <RowActions sessionId={s.id} status={s.status} />
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

function RowActions({
 sessionId,
 status,
}: {
 sessionId: string;
 status: SessionStatus;
}) {
 const [open, setOpen] = useState(false);

 const actions: { label: string; href?: string; destructive?: boolean }[] = [
 { label:"Open", href:`/sessions/${sessionId}`},
 ];
 if (status ==="scheduled"|| status ==="live") {
 actions.push({ label:"Reschedule"});
 actions.push({ label:"Reassign host"});
 actions.push({ label:"Cancel session", destructive: true });
 }
 if (status ==="ended") {
 actions.push({ label:"View attendance", href:`/sessions/${sessionId}`});
 }

 return (
 <div className="relative inline-block text-left">
 <button
 type="button" aria-label="Session actions" aria-haspopup="menu" aria-expanded={open}
 onClick={(e) => {
 e.stopPropagation();
 setOpen((v) => !v);
 }}
 className="dropdown-toggle inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800">
 <MoreDotIcon className="h-5 w-5"/>
 </button>
 <Dropdown
 isOpen={open}
 onClose={() => setOpen(false)}
 className="w-48 p-1">
 <ul role="menu" className="flex flex-col gap-0.5">
 {actions.map((a, i) => (
 <li key={i} role="none">
 <DropdownItem
 tag={a.href ?"a":"button"}
 href={a.href}
 onItemClick={() => setOpen(false)}
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
