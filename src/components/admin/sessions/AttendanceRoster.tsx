"use client";
import React, { useMemo, useState } from "react";
import {
 Table,
 TableBody,
 TableCell,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { MoreDotIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type {
 AttendanceOverride,
 AttendanceRecord,
 SessionDetail,
} from "@/lib/api/sessions";

type FinalStatus ="attended"|"excused"|"missed";

function finalStatusOf(r: AttendanceRecord): FinalStatus {
 if (r.override ==="attended") return "attended";
 if (r.override ==="excused") return "excused";
 if (r.autoCredited) return "attended";
 return "missed";
}

const FILTERS: { id:"all"| FinalStatus; label: string }[] = [
 { id:"all", label:"All"},
 { id:"attended", label:"Attended"},
 { id:"excused", label:"Excused"},
 { id:"missed", label:"Missed"},
];

type AttendanceRosterProps = {
 sessionId: string;
 session: SessionDetail;
};

export default function AttendanceRoster({ sessionId, session }: AttendanceRosterProps) {
 const [records, setRecords] = useState<AttendanceRecord[]>(session.attendance);
 const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
 const [search, setSearch] = useState("");
 const [busyFellow, setBusyFellow] = useState<string | null>(null);

 const counts = useMemo(() => {
 const attended = records.filter((r) => finalStatusOf(r) ==="attended").length;
 const excused = records.filter((r) => finalStatusOf(r) ==="excused").length;
 const missed = records.filter((r) => finalStatusOf(r) ==="missed").length;
 return { attended, excused, missed, total: records.length };
 }, [records]);

 const visible = useMemo(() => {
 const q = search.trim().toLowerCase();
 return records.filter((r) => {
 if (filter !=="all"&& finalStatusOf(r) !== filter) return false;
 if (q && !r.fellowName.toLowerCase().includes(q)) return false;
 return true;
 });
 }, [records, filter, search]);

 // Map UI override → backend status. The backend models attended/missed/rsvpd.
 // "excused" is a UI-only concept that the backend doesn't yet persist; we
 // record it locally so the badge updates but the change won't survive a
 // reload. Real "Mark attended" / "Mark missed" round-trips through
 // POST /sessions/:id/mark-attendance.
 const setOverride = async (
 fellowId: string,
 override: AttendanceOverride | null,
 ) => {
 // Optimistic UI update — settle/rollback after the request finishes.
 const previous = records;
 setRecords((prev) =>
 prev.map((r) =>
 r.fellowId === fellowId
 ? {
 ...r,
 override,
 // When a real round-trip succeeds we'll get the backend truth back;
 // until then mirror the override on autoCredited so the badge flips.
 autoCredited: override === "attended" ? true : r.autoCredited,
 }
 : r,
 ),
 );

 const backendStatus =
 override === "attended"
 ? "attended"
 : override === null
 ? "missed"
 : null;
 if (!backendStatus || sessionId.startsWith("session-")) {
 // No real backend (mock id) or "excused" — UI-only.
 return;
 }

 setBusyFellow(fellowId);
 try {
 const res = await fetch(
 `/api/sessions/${encodeURIComponent(sessionId)}/mark-attendance`,
 {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 credentials: "include",
 body: JSON.stringify({ fellowId, status: backendStatus }),
 },
 );
 if (!res.ok) {
 const body = (await res.json().catch(() => ({}))) as { message?: string };
 throw new Error(body.message ?? `Save failed (${res.status})`);
 }
 } catch (err) {
 setRecords(previous);
 toast.errorFromException("Couldn't update attendance", err);
 }
 setBusyFellow(null);
 };

 if (session.status ==="scheduled") {
 return (
 <EmptyRoster
 title="Session hasn’t started" body="The attendance roster appears once the session begins. Until then you’ll see who has registered."/>
 );
 }
 if (session.status ==="cancelled") {
 return (
 <EmptyRoster
 title="Session was cancelled" body="No attendance was recorded for this session."/>
 );
 }

 return (
 <section className="rounded-2xl border border-gray-200 bg-white">
 <header className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
 <div>
 <h2 className="text-base font-semibold text-gray-800">
 Attendance roster
 </h2>
 <p className="mt-1 text-sm text-gray-500">
 Auto-credited if a fellow stays{" "}
 <span className="font-semibold text-gray-700">
 ≥ {session.attendanceThresholdMinutes} min
 </span>{" "}
 of the {session.durationMinutes}-min session.
 </p>
 </div>
 <div className="flex flex-wrap items-center gap-2 text-sm">
 <Tally tone="success" label="Attended" value={counts.attended} />
 <Tally tone="info" label="Excused" value={counts.excused} />
 <Tally tone="error" label="Missed" value={counts.missed} />
 </div>
 </header>

 <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
 <input
 type="search" value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search fellows…" className="h-10 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-none focus:ring-3 focus:ring-fellowship-navy/10 sm:max-w-xs"/>
 <div className="flex flex-wrap gap-2">
 {FILTERS.map((f) => (
 <button
 key={f.id}
 onClick={() => setFilter(f.id)}
 className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
 filter === f.id
 ?"bg-fellowship-navy text-white":"border border-gray-200 bg-white text-gray-600 hover:bg-gray-50")}
 >
 {f.label}
 </button>
 ))}
 </div>
 </div>

 {/*
   We don't use `overflow-x-auto` on this wrapper any more — that
   implicitly clips vertical overflow in most browsers, which chopped
   the row-level dropdown menu in half. Page-level horizontal scrolling
   handles narrow viewports instead. The min-w on the table keeps the
   columns from collapsing into illegible widths.
 */}
 <div className="w-full">
 <Table className="min-w-[640px]">
 <TableHeader className="border-y border-gray-100 bg-gray-50">
 <TableRow>
 <Th>Fellow</Th>
 <Th>Joined</Th>
 <Th>Left</Th>
 <Th>Minutes</Th>
 <Th>Status</Th>
 <Th right>
 <span className="sr-only">Override</span>
 </Th>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-gray-100">
 {visible.map((r) => (
 <Row
 key={r.fellowId}
 record={r}
 busy={busyFellow === r.fellowId}
 onOverride={(o) => {
 void setOverride(r.fellowId, o);
 }}
 />
 ))}
 {visible.length === 0 && (
 <TableRow>
 <TableCell className="px-6 py-8 text-center text-sm text-gray-500">
 No fellows match.
 </TableCell>
 </TableRow>
 )}
 </TableBody>
 </Table>
 </div>
 </section>
 );
}

function Row({
 record,
 busy,
 onOverride,
}: {
 record: AttendanceRecord;
 busy: boolean;
 onOverride: (o: AttendanceOverride | null) => void;
}) {
 const [open, setOpen] = useState(false);
 const final = finalStatusOf(record);

 return (
 <TableRow className="hover:bg-gray-50">
 <Td>
 <div className="flex items-center gap-3">
 <AvatarText name={record.fellowName} className="h-9 w-9"/>
 <span className="text-sm font-semibold text-gray-800">
 {record.fellowName}
 </span>
 </div>
 </Td>
 <Td>{record.joinedAt ? formatTime(record.joinedAt) : <Dim>—</Dim>}</Td>
 <Td>{record.leftAt ? formatTime(record.leftAt) : <Dim>—</Dim>}</Td>
 <Td>
 <span className="text-sm text-gray-700 tabular-nums">
 {record.totalMinutesPresent}
 </span>
 </Td>
 <Td>
 <FinalStatusBadge status={final} overridden={record.override !== null} />
 </Td>
 <Td right>
 <div className="relative inline-block text-left">
 <button
 type="button" aria-label={`Override attendance for ${record.fellowName}`}
 aria-haspopup="menu" aria-expanded={open}
 onClick={() => setOpen((v) => !v)}
 disabled={busy}
 className="dropdown-toggle inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50">
 <MoreDotIcon className="h-5 w-5"/>
 </button>
 <Dropdown
 isOpen={open}
 onClose={() => setOpen(false)}
 portal
 className="w-48 p-1">
 <ul role="menu" className="flex flex-col gap-0.5">
 <Item
 onClick={() => {
 onOverride("attended");
 setOpen(false);
 }}
 >
 Mark attended
 </Item>
 <Item
 onClick={() => {
 onOverride(null);
 setOpen(false);
 }}
 >
 Mark missed
 </Item>
 <Item
 onClick={() => {
 onOverride("excused");
 setOpen(false);
 }}
 >
 Mark excused (local)
 </Item>
 </ul>
 </Dropdown>
 </div>
 </Td>
 </TableRow>
 );
}

function FinalStatusBadge({
 status,
 overridden,
}: {
 status: FinalStatus;
 overridden: boolean;
}) {
 return (
 <span className="inline-flex items-center gap-2">
 {status ==="attended"&& <Badge color="success">Attended</Badge>}
 {status ==="excused"&& <Badge color="info">Excused</Badge>}
 {status ==="missed"&& <Badge color="error">Missed</Badge>}
 {overridden && (
 <span className="text-xs text-gray-400">override</span>
 )}
 </span>
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

function Item({
 children,
 onClick,
}: {
 children: React.ReactNode;
 onClick: () => void;
}) {
 return (
 <li role="none">
 <DropdownItem
 onClick={onClick}
 baseClassName="block w-full rounded-md text-left px-3 py-2 text-sm font-medium transition-colors" className="text-gray-700 hover:bg-gray-100 hover:text-gray-900">
 {children}
 </DropdownItem>
 </li>
 );
}

function Dim({ children }: { children: React.ReactNode }) {
 return <span className="text-sm text-gray-400">{children}</span>;
}

function Tally({
 tone,
 label,
 value,
}: {
 tone:"success"|"info"|"error";
 label: string;
 value: number;
}) {
 const dot =
 tone ==="success"?"bg-success-500": tone ==="info"?"bg-blue-light-500":"bg-error-500";
 return (
 <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600">
 <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
 {label} <span className="font-semibold text-gray-800 tabular-nums">{value}</span>
 </span>
 );
}

function EmptyRoster({ title, body }: { title: string; body: string }) {
 return (
 <section className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
 <h2 className="text-base font-semibold text-gray-800">
 {title}
 </h2>
 <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
 {body}
 </p>
 </section>
 );
}

function formatTime(iso: string): string {
 return new Date(iso).toLocaleTimeString(undefined, {
 timeZone: "Africa/Lagos",
 hour:"numeric",
 minute:"2-digit",
 });
}
