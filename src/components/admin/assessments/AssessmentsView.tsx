"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { MoreDotIcon, PlusIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { deleteAssessment, type Assessment } from "@/lib/api/assessments";
import CreateAssessmentModal from "./CreateAssessmentModal";

const FILTERS = [
 { id:"all", label:"All"},
 { id:"published", label:"Published"},
 { id:"draft", label:"Draft"},
 { id:"needs-grading", label:"Needs grading"},
] as const;
type FilterId = (typeof FILTERS)[number]["id"];

type AssessmentsViewProps = {
 assessments: Assessment[];
};

export default function AssessmentsView({ assessments }: AssessmentsViewProps) {
 const [filter, setFilter] = useState<FilterId>("all");
 const [search, setSearch] = useState("");
 const [createOpen, setCreateOpen] = useState(false);

 const visible = useMemo(() => {
 const q = search.trim().toLowerCase();
 return assessments.filter((a) => {
 if (filter ==="published"&& !a.isPublished) return false;
 if (filter ==="draft"&& a.isPublished) return false;
 if (filter ==="needs-grading"&& a.awaitingGrading === 0) return false;
 if (q) {
 return (
 a.title.toLowerCase().includes(q) ||
 (a.moduleTitle ??"").toLowerCase().includes(q)
 );
 }
 return true;
 });
 }, [assessments, filter, search]);

 const counts = useMemo(
 () => ({
 total: assessments.length,
 published: assessments.filter((a) => a.isPublished).length,
 draft: assessments.filter((a) => !a.isPublished).length,
 awaiting: assessments.reduce((sum, a) => sum + a.awaitingGrading, 0),
 }),
 [assessments]
 );

 return (
 <>
 <div className="flex flex-col gap-4">
 <Header counts={counts} onCreate={() => setCreateOpen(true)} />
 <Toolbar
 filter={filter}
 setFilter={setFilter}
 search={search}
 setSearch={setSearch}
 awaitingCount={counts.awaiting}
 />
 <AssessmentsTable assessments={visible} />
 </div>
 <CreateAssessmentModal
 isOpen={createOpen}
 onClose={() => setCreateOpen(false)}
 />
 </>
 );
}

function Header({
 counts,
 onCreate,
}: {
 counts: { total: number; published: number; draft: number; awaiting: number };
 onCreate: () => void;
}) {
 return (
 <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
 <div>
 <h1 className="text-title-md font-bold text-gray-800">
 Assessments
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 {counts.total} total · {counts.published} published · {counts.draft}{" "}
 draft
 {counts.awaiting > 0 && (
 <>
 {"·"}
 <span className="font-semibold text-error-600">
 {counts.awaiting} short answers awaiting grading
 </span>
 </>
 )}
 .
 </p>
 </div>
 <Button
 variant="fellowship" size="sm" startIcon={<PlusIcon />}
 onClick={onCreate}
 >
 Create assessment
 </Button>
 </div>
 );
}

function Toolbar({
 filter,
 setFilter,
 search,
 setSearch,
 awaitingCount,
}: {
 filter: FilterId;
 setFilter: (f: FilterId) => void;
 search: string;
 setSearch: (s: string) => void;
 awaitingCount: number;
}) {
 return (
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <input
 type="search" value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search assessments or modules…" className="h-10 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-none focus:ring-3 focus:ring-fellowship-navy/10 sm:max-w-xs"/>
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
 {f.id ==="needs-grading"&& awaitingCount > 0 && filter !== f.id && (
 <span className="rounded-full bg-error-100 px-1.5 text-[10px] font-bold text-error-700">
 {awaitingCount}
 </span>
 )}
 </button>
 ))}
 </div>
 </div>
 );
}

function AssessmentsTable({ assessments }: { assessments: Assessment[] }) {
 if (assessments.length === 0) {
 return (
 <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
 No assessments match.
 </div>
 );
 }

 return (
 <>
 <MobileRowList>
 {assessments.map((a) => (
 <MobileRowCard
 key={a.id}
 header={
 <div>
 <Link
 href={`/assessments/${a.id}`}
 className="block text-sm font-semibold text-gray-800 hover:text-fellowship-navy"
 >
 {a.title}
 </Link>
 <span className="mt-0.5 block text-xs text-gray-500">
 {a.weekNumber !== null && (
 <span className="font-semibold text-fellowship-navy">
 W{String(a.weekNumber).padStart(2, "0")}
 </span>
 )}
 {a.moduleTitle && (
 <>
 {a.weekNumber !== null && " · "}
 {a.moduleTitle}
 </>
 )}
 </span>
 </div>
 }
 status={
 a.isPublished ? (
 <Badge color="success">Published</Badge>
 ) : (
 <Badge color="light">Draft</Badge>
 )
 }
 stats={[
 { label: "Questions", value: a.questionCount },
 {
 label: "Pass rate",
 value: (
 <PassRate
 attempted={a.attemptsCount}
 passed={a.passedCount}
 awaiting={a.awaitingGrading}
 />
 ),
 },
 { label: "Pass mark", value: `${a.passMark}%` },
 {
 label: "Time limit",
 value: a.timeLimitMinutes ? `${a.timeLimitMinutes} min` : "—",
 },
 ]}
 actions={<RowActions assessment={a} />}
 />
 ))}
 </MobileRowList>
 <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white md:block">
 <div className="max-w-full overflow-x-auto">
 <Table>
 <TableHeader className="border-b border-gray-100">
 <TableRow>
 <Th>Assessment</Th>
 <Th>Questions</Th>
 <Th>Pass rate</Th>
 <Th>Pass mark</Th>
 <Th>Time limit</Th>
 <Th>Status</Th>
 <Th right>
 <span className="sr-only">Actions</span>
 </Th>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-gray-100">
 {assessments.map((a) => (
 <TableRow
 key={a.id}
 className="hover:bg-gray-50">
 <Td>
 <Link
 href={`/assessments/${a.id}`}
 className="block text-sm font-semibold text-gray-800 hover:text-fellowship-navy">
 {a.title}
 </Link>
 <span className="mt-0.5 block text-xs text-gray-500">
 {a.weekNumber !== null && (
 <span className="font-semibold text-fellowship-navy">
 W{String(a.weekNumber).padStart(2,"0")}
 </span>
 )}
 {a.moduleTitle && (
 <>
 {a.weekNumber !== null && "· " }
 {a.moduleTitle}
 </>
 )}
 </span>
 </Td>
 <Td>
 <span className="text-sm tabular-nums text-gray-700">
 {a.questionCount}
 </span>
 </Td>
 <Td>
 <PassRate
 attempted={a.attemptsCount}
 passed={a.passedCount}
 awaiting={a.awaitingGrading}
 />
 </Td>
 <Td>
 <span className="text-sm tabular-nums text-gray-700">
 {a.passMark}%
 </span>
 </Td>
 <Td>
 <span className="text-sm tabular-nums text-gray-700">
 {a.timeLimitMinutes ?`${a.timeLimitMinutes} min`: (
 <span className="text-gray-400">—</span>
 )}
 </span>
 </Td>
 <Td>
 {a.isPublished ? (
 <Badge color="success">Published</Badge>
 ) : (
 <Badge color="light">Draft</Badge>
 )}
 </Td>
 <Td right>
 <RowActions assessment={a} />
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

function PassRate({
 attempted,
 passed,
 awaiting,
}: {
 attempted: number;
 passed: number;
 awaiting: number;
}) {
 if (attempted === 0) {
 return <span className="text-sm text-gray-400">No attempts</span>;
 }
 const pct = Math.round((passed / attempted) * 100);
 return (
 <div className="flex flex-col gap-1">
 <span className="text-sm tabular-nums text-gray-700">
 {passed}/{attempted}{" "}
 <span className="text-xs text-gray-500">
 ({pct}%)
 </span>
 </span>
 {awaiting > 0 && (
 <span className="text-xs font-medium text-error-600">
 {awaiting} awaiting grading
 </span>
 )}
 </div>
 );
}

function RowActions({ assessment }: { assessment: Assessment }) {
 const [open, setOpen] = useState(false);
 const [deleting, setDeleting] = useState(false);
 const router = useRouter();
 const { confirm, dialog } = useConfirm();

 // Publish/Unpublish + Duplicate aren't wired to the backend yet; hidden
 // until the corresponding endpoints exist rather than rendered as no-ops
 // that look broken when clicked.
 type Action =
 | { kind: "link"; label: string; href: string }
 | { kind: "delete"; label: string };
 const actions: Action[] = [
 { kind: "link", label: "Open", href: `/assessments/${assessment.id}` },
 {
 kind: "link",
 label: "View submissions",
 href: `/assessments/${assessment.id}#submissions`,
 },
 { kind: "delete", label: "Delete" },
 ];

 const handleDelete = async () => {
 const ok = await confirm({
 title: "Delete assessment?",
 message: `"${assessment.title}" and all of its questions and submissions will be permanently removed. This can't be undone.`,
 confirmLabel: "Delete",
 tone: "danger",
 });
 if (!ok) return;
 setDeleting(true);
 try {
 await deleteAssessment(assessment.id);
 toast.success("Assessment deleted");
 router.refresh();
 } catch (err) {
 toast.errorFromException("Couldn't delete assessment", err);
 } finally {
 setDeleting(false);
 }
 };

 return (
 <div className="relative inline-block text-left">
 <button
 type="button" aria-label={`Actions for ${assessment.title}`}
 aria-haspopup="menu" aria-expanded={open}
 onClick={() => setOpen((v) => !v)}
 className="dropdown-toggle inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800">
 <MoreDotIcon className="h-5 w-5"/>
 </button>
 <Dropdown
 isOpen={open}
 onClose={() => setOpen(false)}
 portal
 className="w-48 p-1">
 <ul role="menu" className="flex flex-col gap-0.5">
 {actions.map((a, i) => {
 const destructive = a.kind === "delete";
 return (
 <li key={i} role="none">
 <DropdownItem
 tag={a.kind === "link" ? "a" : "button"}
 href={a.kind === "link" ? a.href : undefined}
 onItemClick={() => {
 setOpen(false);
 if (a.kind === "delete" && !deleting) void handleDelete();
 }}
 baseClassName="block w-full rounded-md text-left px-3 py-2 text-sm font-medium transition-colors" className={
 destructive
 ? "text-error-600 hover:bg-error-50"
 : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
 }
 >
 {a.kind === "delete" && deleting ? "Deleting…" : a.label}
 </DropdownItem>
 </li>
 );
 })}
 </ul>
 </Dropdown>
 {dialog}
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
