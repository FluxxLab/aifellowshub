"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

type FinalStatus = "attended" | "excused" | "in_session" | "missed";

function finalStatusOf(r: AttendanceRecord): FinalStatus {
  if (r.override === "attended") return "attended";
  if (r.override === "excused") return "excused";
  if (r.inSession) return "in_session";
  if (r.autoCredited) return "attended";
  return "missed";
}

const FILTERS: { id: "all" | FinalStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "attended", label: "Attended" },
  { id: "in_session", label: "In session" },
  { id: "excused", label: "Excused" },
  { id: "missed", label: "Missed" },
];

type AttendanceRosterProps = {
 sessionId: string;
 session: SessionDetail;
};

export default function AttendanceRoster({ sessionId, session }: AttendanceRosterProps) {
 const router = useRouter();
 const [records, setRecords] = useState<AttendanceRecord[]>(session.attendance);
 const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
 const [search, setSearch] = useState("");
 const [busyFellow, setBusyFellow] = useState<string | null>(null);
 const [bulkOpen, setBulkOpen] = useState(false);
 const [bulkMinutes, setBulkMinutes] = useState("");
 const [bulkBusy, setBulkBusy] = useState(false);
 const [syncBusy, setSyncBusy] = useState(false);
 const [refreshing, setRefreshing] = useState(false);

 // Sync local records when the server re-renders fresh data (after router.refresh()).
 useEffect(() => {
  setRecords(session.attendance);
 }, [session.attendance]);

 const refreshRecording = useCallback(async () => {
  setRefreshing(true);
  router.refresh();
  // Give the server component time to re-render before clearing the spinner.
  await new Promise((r) => setTimeout(r, 1200));
  setRefreshing(false);
 }, [router]);

 // Auto-refresh every 30 s when the session has a recording so admins
 // see live watch progress without manually reloading the page.
 useEffect(() => {
  if (!session.hasRecording) return;
  const id = setInterval(() => { void refreshRecording(); }, 30_000);
  return () => clearInterval(id);
 }, [session.hasRecording, refreshRecording]);

  const counts = useMemo(() => {
    const attended = records.filter((r) => finalStatusOf(r) === "attended").length;
    const inSession = records.filter((r) => finalStatusOf(r) === "in_session").length;
    const excused = records.filter((r) => finalStatusOf(r) === "excused").length;
    const missed = records.filter((r) => finalStatusOf(r) === "missed").length;
    return { attended, inSession, excused, missed, total: records.length };
  }, [records]);

 const visible = useMemo(() => {
 const q = search.trim().toLowerCase();
 return records.filter((r) => {
 if (filter !=="all"&& finalStatusOf(r) !== filter) return false;
 if (q && !r.fellowName.toLowerCase().includes(q)) return false;
 return true;
 });
 }, [records, filter, search]);

 const setOverride = async (
 fellowId: string,
 override: AttendanceOverride | null,
 minutesAttended?: number,
 ) => {
 // Optimistic UI update — settle/rollback after the request finishes.
 const previous = records;
 setRecords((prev) =>
 prev.map((r) =>
 r.fellowId === fellowId
 ? {
 ...r,
 override,
 autoCredited: override === "attended" ? true : r.autoCredited,
 totalMinutesPresent: minutesAttended ?? r.totalMinutesPresent,
 }
 : r,
 ),
 );

 const backendStatus =
 override === "attended"
 ? "attended"
 : override === "excused"
 ? "excused"
 : override === null
 ? "missed"
 : null;
 if (!backendStatus || sessionId.startsWith("session-")) {
 return;
 }

 setBusyFellow(fellowId);
 try {
 const body: Record<string, unknown> = { fellowId, status: backendStatus };
 if (minutesAttended !== undefined) body.minutesAttended = minutesAttended;
 const res = await fetch(
 `/api/sessions/${encodeURIComponent(sessionId)}/mark-attendance`,
 {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 credentials: "include",
 body: JSON.stringify(body),
 },
 );
 if (!res.ok) {
 const errBody = (await res.json().catch(() => ({}))) as { message?: string };
 throw new Error(errBody.message ?? `Save failed (${res.status})`);
 }
 } catch (err) {
 setRecords(previous);
 toast.errorFromException("Couldn't update attendance", err);
 }
 setBusyFellow(null);
 };

 const bulkSetMinutes = async () => {
  const mins = parseInt(bulkMinutes, 10);
  if (!Number.isFinite(mins) || mins < 0 || mins > session.durationMinutes) return;
  if (sessionId.startsWith("session-")) { setBulkOpen(false); return; }
  setBulkBusy(true);
  const attended = records.filter((r) => finalStatusOf(r) === "attended");
  const previous = records;
  setRecords((prev) =>
   prev.map((r) =>
    finalStatusOf(r) === "attended" ? { ...r, totalMinutesPresent: mins } : r,
   ),
  );
  try {
   await Promise.all(
    attended.map((r) =>
     fetch(`/api/sessions/${encodeURIComponent(sessionId)}/mark-attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ fellowId: r.fellowId, status: "attended", minutesAttended: mins }),
     }).then((res) => {
      if (!res.ok) throw new Error(`Failed for ${r.fellowName}`);
     }),
    ),
   );
   toast.success("Minutes updated", `Set ${mins} min for ${attended.length} attended fellows.`);
   setBulkOpen(false);
   setBulkMinutes("");
  } catch {
   setRecords(previous);
   toast.error("Bulk update failed", "Some records may not have saved — try again.");
  }
  setBulkBusy(false);
 };

 const syncFromZoom = async () => {
  if (sessionId.startsWith("session-")) return;
  setSyncBusy(true);
  try {
   const res = await fetch(
    `/api/sessions/${encodeURIComponent(sessionId)}/reconcile-attendance`,
    { method: "POST", credentials: "include" },
   );
   if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Sync failed (${res.status})`);
   }
   const data = (await res.json()) as { reconciled: number; unresolved: number };
   toast.success(
    "Synced from Zoom",
    data.reconciled > 0
     ? `${data.reconciled} records updated${data.unresolved > 0 ? ` · ${data.unresolved} unresolved (check logs)` : ""}.`
     : "No new data — Zoom may still be processing. Try again in a few minutes.",
   );
   // Reload the page so the roster reflects the updated records.
   window.location.reload();
  } catch (err) {
   toast.errorFromException("Sync failed", err);
  }
  setSyncBusy(false);
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
    {counts.inSession > 0 && (
      <Tally tone="live" label="In session" value={counts.inSession} />
    )}
    <Tally tone="info" label="Excused" value={counts.excused} />
    <Tally tone="error" label="Missed" value={counts.missed} />
 {session.hasRecording && (
  <button
   type="button"
   onClick={() => void refreshRecording()}
   disabled={refreshing}
   title="Reload recording watch progress for all fellows"
   className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
  >
   {refreshing ? "Refreshing…" : "Refresh recording"}
  </button>
 )}
 {session.status === "ended" && (
  <button
   type="button"
   onClick={() => void syncFromZoom()}
   disabled={syncBusy}
   title="Pull participant data from Zoom and fill any missing attendance records"
   className="rounded-full border border-brand-500 bg-white px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 disabled:opacity-50"
  >
   {syncBusy ? "Syncing…" : "Sync from Zoom"}
  </button>
 )}
 {session.status === "ended" && (
  bulkOpen ? (
   <div className="flex items-center gap-1.5">
    <input
     type="number"
     min={0}
     max={session.durationMinutes}
     value={bulkMinutes}
     onChange={(e) => setBulkMinutes(e.target.value)}
     onKeyDown={(e) => { if (e.key === "Enter") void bulkSetMinutes(); if (e.key === "Escape") { setBulkOpen(false); setBulkMinutes(""); } }}
     placeholder={`0–${session.durationMinutes}`}
     autoFocus
     className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:border-fellowship-navy focus:outline-none"
    />
    <button
     type="button"
     onClick={() => void bulkSetMinutes()}
     disabled={bulkBusy || bulkMinutes === ""}
     className="rounded bg-fellowship-navy px-2.5 py-1 text-xs font-semibold text-white hover:bg-fellowship-navy/90 disabled:opacity-50"
    >
     {bulkBusy ? "Saving…" : `Set for all ${counts.attended} attended`}
    </button>
    <button
     type="button"
     onClick={() => { setBulkOpen(false); setBulkMinutes(""); }}
     className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
    >
     Cancel
    </button>
   </div>
  ) : (
   <button
    type="button"
    onClick={() => setBulkOpen(true)}
    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
   >
    Set minutes for all attended
   </button>
  )
 )}
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
 <Table className="min-w-[800px]">
 <TableHeader className="border-y border-gray-100 bg-gray-50">
 <TableRow>
 <Th>Fellow</Th>
 <Th>Joined</Th>
 <Th>Left</Th>
 <Th>Minutes</Th>
 <Th>Recording</Th>
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
 sessionDurationMinutes={session.durationMinutes}
 onOverride={(o, mins) => {
 void setOverride(r.fellowId, o, mins);
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
 sessionDurationMinutes,
 onOverride,
}: {
 record: AttendanceRecord;
 busy: boolean;
 sessionDurationMinutes: number;
 onOverride: (o: AttendanceOverride | null, minutes?: number) => void;
}) {
 const [open, setOpen] = useState(false);
 const [markingAttended, setMarkingAttended] = useState(false);
 const [minutesInput, setMinutesInput] = useState("");
 const final = finalStatusOf(record);

 // Live elapsed-minute counter for fellows currently in the room.
 // Fires every 30 s so the display stays current without hammering the server.
 const [liveMinutes, setLiveMinutes] = useState<number | null>(null);
 useEffect(() => {
  if (!record.inSession || !record.joinedAt) {
   setLiveMinutes(null);
   return;
  }
  const compute = () => {
   const elapsed = Math.floor(
    (Date.now() - new Date(record.joinedAt!).getTime()) / 60_000,
   );
   setLiveMinutes(Math.max(record.totalMinutesPresent, elapsed));
  };
  compute();
  const id = setInterval(compute, 30_000);
  return () => clearInterval(id);
 }, [record.inSession, record.joinedAt, record.totalMinutesPresent]);

 const displayMinutes =
  record.inSession && liveMinutes !== null
   ? liveMinutes
   : record.totalMinutesPresent;

 function submitAttended() {
  const mins = minutesInput.trim() === "" ? undefined : Number(minutesInput);
  onOverride("attended", mins);
  setMarkingAttended(false);
  setMinutesInput("");
  setOpen(false);
 }

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
 {displayMinutes}
 </span>
 </Td>
 <Td>
   <RecordingWatchCell
     watchedSeconds={record.recordingWatchedSeconds}
     creditedAt={record.recordingCreditedAt}
     skipCount={record.recordingSkipCount}
     sessionDurationMinutes={sessionDurationMinutes}
   />
 </Td>
 <Td>
 <FinalStatusBadge status={final} overridden={record.override !== null} />
 </Td>
 <Td right>
 <div className="relative inline-block text-left">
 <button
 type="button" aria-label={`Override attendance for ${record.fellowName}`}
 aria-haspopup="menu" aria-expanded={open}
 onClick={() => { setOpen((v) => !v); setMarkingAttended(false); setMinutesInput(""); }}
 disabled={busy}
 className="dropdown-toggle inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50">
 <MoreDotIcon className="h-5 w-5"/>
 </button>
 <Dropdown
 isOpen={open}
 onClose={() => { setOpen(false); setMarkingAttended(false); setMinutesInput(""); }}
 portal
 className="w-56 p-1">
 {markingAttended ? (
  <div className="px-3 py-2">
   <p className="mb-1.5 text-xs font-semibold text-gray-600">
    Minutes attended (0–{sessionDurationMinutes})
   </p>
   <div className="flex gap-1.5">
    <input
     type="number"
     min={0}
     max={sessionDurationMinutes}
     value={minutesInput}
     onChange={(e) => setMinutesInput(e.target.value)}
     onKeyDown={(e) => { if (e.key === "Enter") submitAttended(); if (e.key === "Escape") { setMarkingAttended(false); setMinutesInput(""); } }}
     placeholder={String(sessionDurationMinutes)}
     autoFocus
     className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:border-fellowship-navy focus:outline-none"
    />
    <button
     type="button"
     onClick={submitAttended}
     className="rounded bg-fellowship-navy px-2.5 py-1 text-xs font-semibold text-white hover:bg-fellowship-navy/90"
    >
     Save
    </button>
    <button
     type="button"
     onClick={() => { setMarkingAttended(false); setMinutesInput(""); }}
     className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
    >
     ✕
    </button>
   </div>
   <p className="mt-1.5 text-xs text-gray-400">Leave blank to keep current ({record.totalMinutesPresent} min)</p>
  </div>
 ) : (
 <ul role="menu" className="flex flex-col gap-0.5">
 <Item onClick={() => setMarkingAttended(true)}>
  Mark attended…
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
 )}
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
      {status === "attended" && <Badge color="success">Attended</Badge>}
      {status === "excused" && <Badge color="info">Excused</Badge>}
      {status === "in_session" && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
          In session
        </span>
      )}
      {status === "missed" && <Badge color="error">Missed</Badge>}
      {overridden && <span className="text-xs text-gray-400">override</span>}
    </span>
  );
}

function RecordingWatchCell({
  watchedSeconds,
  creditedAt,
  skipCount,
  sessionDurationMinutes,
}: {
  watchedSeconds: number;
  creditedAt: string | null;
  skipCount: number;
  sessionDurationMinutes: number;
}) {
  const durationSeconds = sessionDurationMinutes * 60;
  const pct = durationSeconds > 0
    ? Math.min(100, Math.round((watchedSeconds / durationSeconds) * 100))
    : 0;

  if (watchedSeconds === 0 && !creditedAt) {
    return <span className="text-sm text-gray-400">—</span>;
  }

  const mins = Math.floor(watchedSeconds / 60);
  const totalMins = sessionDurationMinutes;

  return (
    <div className="flex flex-col gap-1 min-w-[100px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs tabular-nums text-gray-700">
          {mins}/{totalMins} min ({pct}%)
        </span>
        <div className="flex items-center gap-1">
          {skipCount > 0 && (
            <span className="rounded-full bg-warning-50 px-1.5 py-0.5 text-[10px] font-semibold text-warning-700">
              {skipCount} skip{skipCount !== 1 ? "s" : ""}
            </span>
          )}
          {creditedAt && (
            <span className="rounded-full bg-success-50 px-1.5 py-0.5 text-[10px] font-semibold text-success-700">
              Credited
            </span>
          )}
        </div>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${creditedAt ? "bg-success-500" : "bg-fellowship-navy"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
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
  tone: "success" | "info" | "live" | "error";
  label: string;
  value: number;
}) {
  const dot =
    tone === "success"
      ? "bg-success-500"
      : tone === "info"
      ? "bg-blue-light-500"
      : tone === "live"
      ? "bg-brand-500 animate-pulse"
      : "bg-error-500";
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
