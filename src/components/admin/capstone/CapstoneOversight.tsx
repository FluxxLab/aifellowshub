"use client";
import React, { useMemo, useState } from "react";
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
import {
 isOverdue,
 type CapstoneStatus,
 type CapstoneSubmission,
} from "@/lib/api/capstone";
import AdminCapstoneUpload from "./AdminCapstoneUpload";
import AssignCapstoneMentorModal from "./AssignCapstoneMentorModal";
import { useConfirm } from "@/components/ui/ConfirmDialog";

const FILTERS: { id:"all"|"overdue"| CapstoneStatus; label: string }[] = [
 { id:"all", label:"All"},
 { id:"overdue", label:"Overdue"},
 { id:"submitted", label:"Submitted"},
 { id:"under-review", label:"Under review"},
 { id:"revision-required", label:"Revision required"},
 { id:"approved", label:"Approved"},
 { id:"draft", label:"Draft"},
];

type CapstoneOversightProps = {
 submissions: CapstoneSubmission[];
};

export default function CapstoneOversight({
 submissions,
}: CapstoneOversightProps) {
 const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
 const [search, setSearch] = useState("");

 const counts = useMemo(() => {
 const c = {
 total: submissions.length,
 overdue: submissions.filter((s) => isOverdue(s)).length,
 submitted: submissions.filter((s) => s.status ==="submitted").length,
 underReview: submissions.filter((s) => s.status ==="under-review").length,
 revisionRequired: submissions.filter((s) => s.status ==="revision-required").length,
 approved: submissions.filter((s) => s.status ==="approved").length,
 draft: submissions.filter((s) => s.status ==="draft").length,
 };
 return c;
 }, [submissions]);

 const visible = useMemo(() => {
 const q = search.trim().toLowerCase();
 return submissions.filter((s) => {
 if (filter ==="overdue"&& !isOverdue(s)) return false;
 if (
 filter !=="all"&&
 filter !=="overdue"&&
 s.status !== filter
 )
 return false;
 if (q) {
 return (
 s.fellowName.toLowerCase().includes(q) ||
 (s.mentorName ??"").toLowerCase().includes(q) ||
 (s.title ??"").toLowerCase().includes(q)
 );
 }
 return true;
 });
 }, [submissions, filter, search]);

 return (
 <div className="flex flex-col gap-4">
 <Header counts={counts} />
 <Toolbar
 filter={filter}
 setFilter={setFilter}
 search={search}
 setSearch={setSearch}
 overdueCount={counts.overdue}
 onExport={() => exportCapstoneStatusReport(visible)}
 exportCount={visible.length}
 />
 <CapstoneTable submissions={visible} />
 </div>
 );
}

/**
 * Download the capstone progress as CSV — the status report programme
 * administration shares with partners.
 *
 * Exports exactly what the table is showing, filters and search included: an
 * admin who has narrowed to "overdue" wants that list, not all of them. The
 * row count is on the button so it's clear what's about to be downloaded.
 */
function exportCapstoneStatusReport(rows: CapstoneSubmission[]) {
 // Quote every field and double any embedded quotes — capstone titles and
 // problem statements contain commas, quotes, and newlines.
 const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
 const date = (iso: string | null) =>
 iso ? new Date(iso).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos" }) : "";

 const headers = [
 "Fellow",
 "Sector",
 "Capstone title",
 "Status",
 "Mentor",
 "Version",
 "Submitted",
 "Last activity",
 "Days since activity",
 "Overdue",
 "Problem statement",
 ];

 const body = rows.map((s) =>
 [
 s.fellowName,
 s.sector,
 s.title ?? "Untitled capstone",
 STATUS_EXPORT_LABEL[s.status] ?? s.status,
 s.mentorName ?? "Unassigned",
 String(s.version),
 date(s.submittedAt),
 date(s.lastActivityAt),
 String(s.daysSinceActivity),
 isOverdue(s) ? "Yes" : "No",
 s.description,
 ].map(escape),
 );

 const csv =
 "﻿" + // BOM so Excel reads UTF-8 (fellow names carry accents)
 [headers.map(escape), ...body].map((r) => r.join(",")).join("\r\n");

 const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `capstone-status-${new Date().toISOString().slice(0, 10)}.csv`;
 a.click();
 URL.revokeObjectURL(url);
}

/** Human labels for the report — the raw ids read poorly in a shared file. */
const STATUS_EXPORT_LABEL: Record<string, string> = {
 draft: "Draft",
 submitted: "Submitted",
 "under-review": "Under review",
 "revision-required": "Revision required",
 approved: "Approved",
};

function Header({
 counts,
}: {
 counts: {
 total: number;
 overdue: number;
 submitted: number;
 underReview: number;
 approved: number;
 draft: number;
 };
}) {
 const inReview = counts.submitted + counts.underReview;
 return (
 <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
 <div>
 <h1 className="text-title-md font-bold text-gray-800">
 Capstone
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 {counts.total} capstones · {inReview} in review · {counts.approved}{" "}
 approved
 {counts.overdue > 0 && (
 <>
 {"·"}
 <span className="font-semibold text-error-600">
 {counts.overdue} overdue {counts.overdue === 1 ?"review":"reviews"}
 </span>
 </>
 )}
 . Mentors review; admin oversees.
 </p>
 </div>
 </div>
 );
}

function Toolbar({
 filter,
 setFilter,
 search,
 setSearch,
 overdueCount,
 onExport,
 exportCount,
}: {
 filter: (typeof FILTERS)[number]["id"];
 setFilter: (f: (typeof FILTERS)[number]["id"]) => void;
 search: string;
 setSearch: (s: string) => void;
 overdueCount: number;
 onExport: () => void;
 exportCount: number;
}) {
 return (
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <input
 type="search" value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search fellows, mentors, or titles…" className="h-10 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-none focus:ring-3 focus:ring-fellowship-navy/10 sm:max-w-xs"/>
 <div className="flex flex-wrap gap-2">
 {FILTERS.map((f) => (
 <button
 key={f.id}
 onClick={() => setFilter(f.id)}
 className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
 filter === f.id
 ?"bg-fellowship-navy text-white":"border border-gray-200 bg-white text-gray-600 hover:bg-gray-50")}
 >
 {f.label}
 {f.id ==="overdue"&& overdueCount > 0 && filter !== f.id && (
 <span className="rounded-full bg-error-100 px-1.5 text-[10px] font-bold text-error-700">
 {overdueCount}
 </span>
 )}
 </button>
 ))}
 {/* Exports the filtered view, so the count makes clear what's included. */}
 <button
 type="button"
 onClick={onExport}
 disabled={exportCount === 0}
 title="Download the capstones currently listed as a CSV status report"
 className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
 >
 <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
 </svg>
 Export ({exportCount})
 </button>
 </div>
 </div>
 );
}

function CapstoneTable({ submissions }: { submissions: CapstoneSubmission[] }) {
 if (submissions.length === 0) {
 return (
 <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
 No capstones match.
 </div>
 );
 }

 return (
 <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
 <div className="max-w-full overflow-x-auto">
 <Table>
 <TableHeader className="border-b border-gray-100">
 <TableRow>
 <Th>Fellow</Th>
 <Th>Title</Th>
 <Th>Mentor</Th>
 <Th>Status</Th>
 <Th>Version</Th>
 <Th>Last activity</Th>
 <Th right>
 <span className="sr-only">Actions</span>
 </Th>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-gray-100">
 {submissions.map((s) => {
 const overdue = isOverdue(s);
 return (
 <TableRow
 key={s.id}
 className={cn("hover:bg-gray-50",
 overdue &&"bg-error-50/40")}
 >
 <Td>
 <div className="flex items-center gap-3">
 <AvatarText name={s.fellowName} className="h-9 w-9"/>
 <div>
 <span className="block text-sm font-semibold text-gray-800">
 {s.fellowName}
 </span>
 <span className="block text-xs text-gray-500">
 {s.sector}
 </span>
 </div>
 </div>
 </Td>
 <Td>
   <div className="flex items-center gap-2 max-w-md">
     {s.title ? (
       <span className="truncate text-sm text-gray-700">{s.title}</span>
     ) : (
       <span className="text-sm italic text-gray-400">Not yet titled</span>
     )}
     {hasDownloadable(s) && (
       <button
         type="button"
         onClick={() => downloadCapstoneSubmission(s)}
         title="Download submission"
         className="shrink-0 rounded p-0.5 text-gray-400 hover:text-fellowship-navy"
       >
         <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
         </svg>
       </button>
     )}
     {/* Upload on the fellow's behalf — certification keys on this document
         existing, so the programme team needs a way to attach one when the
         fellow can't upload it themselves. */}
     <div className="shrink-0">
       <AdminCapstoneUpload
         capstoneId={s.id}
         fellowName={s.fellowName}
         hasDocument={Boolean(s.fileUrl)}
       />
     </div>
   </div>
 </Td>
 <Td>
 {s.mentorName ? (
 <div className="flex items-center gap-2">
 <AvatarText
 name={s.mentorName}
 className="h-7 w-7 text-xs"/>
 <div className="min-w-0">
 <span className="text-sm text-gray-700">
 {s.mentorName}
 </span>
 {/* A name here does NOT mean a supervisor was assigned — the API
     falls back to the fellow's mentor or the first mentor in the
     sector. Saying so is the difference between an assignment and a
     guess that silently moves when the mentor roster changes. */}
 {!s.assignedMentorId && (
 <span
 className="block text-[11px] italic text-amber-600"
 title="No supervisor assigned — this mentor is inferred from the fellow's mentor or their sector, and can change if the mentor roster does."
 >
 auto — not assigned
 </span>
 )}
 </div>
 </div>
 ) : (
 <span className="text-sm italic text-gray-400">
 Unassigned
 </span>
 )}
 </Td>
 <Td>
 <div className="flex items-center gap-2">
 <CapstoneStatusBadge status={s.status} />
 {overdue && (
 <span
 className="inline-flex items-center gap-1 rounded-full bg-error-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-error-700" title={`Stalled for ${s.daysSinceActivity} days`}
 >
 Overdue
 </span>
 )}
 </div>
 </Td>
 <Td>
 <span className="text-sm tabular-nums text-gray-700">
 v{s.version}
 </span>
 </Td>
 <Td>
 <span
 className={cn("text-sm tabular-nums",
 overdue
 ?"font-semibold text-error-600":"text-gray-500")}
 >
 {relativeDays(s.lastActivityAt)}
 </span>
 </Td>
 <Td right>
 <RowActions submission={s} />
 </Td>
 </TableRow>
 );
 })}
 </TableBody>
 </Table>
 </div>
 </div>
 );
}

function CapstoneStatusBadge({ status }: { status: CapstoneStatus }) {
 if (status ==="approved") return <Badge color="success">Approved</Badge>;
 if (status ==="under-review")
 return <Badge color="warning">Under review</Badge>;
 if (status ==="submitted") return <Badge color="info">Submitted</Badge>;
 if (status ==="revision-required")
 return <Badge color="error">Revision required</Badge>;
 return <Badge color="light">Draft</Badge>;
}

function RowActions({ submission }: { submission: CapstoneSubmission }) {
 const [open, setOpen] = useState(false);
 const [assignOpen, setAssignOpen] = useState(false);
 const [retracting, setRetracting] = useState(false);
 const [deleting, setDeleting] = useState(false);
 const router = useRouter();
 const { confirm, dialog } = useConfirm();

 const handleRetract = async () => {
   const ok = await confirm({
     title: "Retract submission?",
     message: `This resets ${submission.fellowName}'s capstone back to draft so they can edit and re-submit. Their work and the feedback history are kept — nothing is deleted.`,
     confirmLabel: "Retract submission",
     tone: "danger",
   });
   if (!ok) return;
   setRetracting(true);
   try {
     const res = await fetch(`/api/capstones/${encodeURIComponent(submission.id)}/submission`, {
       method: "DELETE",
     });
     if (!res.ok) throw new Error(await res.text());
     router.refresh();
   } catch {
     // surface nothing — refresh will show current state
   } finally {
     setRetracting(false);
   }
 };

 const handleDelete = async () => {
   const ok = await confirm({
     title: "Delete capstone permanently?",
     message: `This permanently removes ${submission.fellowName}'s entire capstone — content, the uploaded document, and all mentor feedback. This can't be undone, and the fellow is notified.`,
     confirmLabel: "Delete capstone",
     tone: "danger",
   });
   if (!ok) return;
   setDeleting(true);
   try {
     const res = await fetch(`/api/capstones/${encodeURIComponent(submission.id)}`, {
       method: "DELETE",
     });
     if (!res.ok) throw new Error(await res.text());
     router.refresh();
   } catch {
     // surface nothing — refresh will show current state
   } finally {
     setDeleting(false);
   }
 };

 const actions: {
   label: string;
   href?: string;
   onClick?: () => void;
   destructive?: boolean;
 }[] = [
 { label:"Open fellow profile", href:`/participants/${submission.fellowId}`},
 ];
 if (hasDownloadable(submission)) {
   actions.push({
     label: "Download submission",
     onClick: () => downloadCapstoneSubmission(submission),
   });
 }
 actions.push({
   label: submission.mentorName ? "Reassign supervisor" : "Assign supervisor",
   onClick: () => setAssignOpen(true),
 });
 if (submission.status === "under-review" || submission.status === "submitted") {
   actions.push({
     label: retracting ? "Retracting…" : "Retract submission",
     onClick: handleRetract,
     destructive: true,
   });
 }
 // Permanent deletion — available for any status (admin override).
 actions.push({
   label: deleting ? "Deleting…" : "Delete capstone",
   onClick: handleDelete,
   destructive: true,
 });

 return (
 <div className="relative inline-block text-left">
 <button
 type="button" aria-label={`Actions for ${submission.fellowName}'s capstone`}
 aria-haspopup="menu" aria-expanded={open}
 onClick={() => setOpen((v) => !v)}
 className="dropdown-toggle inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800">
 <MoreDotIcon className="h-5 w-5"/>
 </button>
 <Dropdown isOpen={open} onClose={() => setOpen(false)} portal className="w-52 p-1">
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
 <AssignCapstoneMentorModal
 isOpen={assignOpen}
 onClose={() => setAssignOpen(false)}
 capstoneId={submission.id}
 fellowName={submission.fellowName}
 fellowSector={submission.sector}
 currentMentorId={submission.assignedMentorId}
 />
 {dialog}
 </div>
 );
}

/** Whether there's anything to download for this capstone — either an
 *  uploaded file, or text content we can render into a document. */
function hasDownloadable(s: CapstoneSubmission): boolean {
  return Boolean(
    s.fileUrl ||
      s.submissionUrl ||
      s.description?.trim() ||
      s.content?.trim(),
  );
}

/**
 * Download a fellow's capstone. If they uploaded a file (Word/PDF), open it.
 * Otherwise — most submissions are typed text, not an uploaded file — build a
 * Word-openable document from the title, problem statement, and body so the
 * admin always gets a downloadable submission instead of nothing.
 */
function downloadCapstoneSubmission(s: CapstoneSubmission): void {
  const fileUrl = s.fileUrl ?? s.submissionUrl;
  if (fileUrl) {
    window.open(fileUrl, "_blank", "noopener,noreferrer");
    return;
  }

  const esc = (t: string) =>
    t
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br/>");
  const title = s.title || "Untitled capstone";
  const html =
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title></head><body>` +
    `<h1>${esc(title)}</h1>` +
    `<p><b>Fellow:</b> ${esc(s.fellowName)}<br/>` +
    `<b>Sector:</b> ${esc(s.sector)}<br/>` +
    `<b>Status:</b> ${esc(s.status)}` +
    (s.submittedAt ? `<br/><b>Submitted:</b> ${esc(new Date(s.submittedAt).toLocaleString())}` : "") +
    `</p>` +
    `<h2>Problem statement</h2><p>${esc(s.description || "—")}</p>` +
    `<h2>Approach</h2><p>${esc(s.content || "—")}</p>` +
    `</body></html>`;

  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safe = `${s.fellowName}-${title}`.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  a.href = url;
  a.download = `capstone-${safe}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
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

function Td({ children, right }: { children: React.ReactNode; right?: boolean }) {
 return (
 <TableCell
 className={`px-5 py-4 sm:px-6 ${right ?"text-right":"text-left"}`}
 >
 {children}
 </TableCell>
 );
}

function relativeDays(iso: string): string {
 const days = Math.round(
 (Date.now() - new Date(iso).getTime()) / 86_400_000
 );
 if (days <= 0) return "Today";
 if (days === 1) return "Yesterday";
 return `${days}d ago`;
}
