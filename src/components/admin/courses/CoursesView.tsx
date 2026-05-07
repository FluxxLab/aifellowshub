"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
 Table,
 TableBody,
 TableCell,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { toast } from "@/lib/toast";
import { MoreDotIcon, PlusIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { deleteCourse, updateCourse, type Course } from "@/lib/api/courses";
import { useRouter } from "next/navigation";
import CreateCourseModal from "./CreateCourseModal";

const FILTERS = [
 { id:"all", label:"All"},
 { id:"published", label:"Published"},
 { id:"draft", label:"Draft"},
] as const;
type FilterId = (typeof FILTERS)[number]["id"];

type CoursesViewProps = {
 courses: Course[];
};

export default function CoursesView({ courses }: CoursesViewProps) {
 const [filter, setFilter] = useState<FilterId>("all");
 const [search, setSearch] = useState("");
 const [createOpen, setCreateOpen] = useState(false);

 const visible = useMemo(() => {
 const q = search.trim().toLowerCase();
 return courses.filter((c) => {
 if (filter ==="published"&& !c.isPublished) return false;
 if (filter ==="draft"&& c.isPublished) return false;
 if (q) {
 return (
 c.title.toLowerCase().includes(q) ||
 c.ownerName.toLowerCase().includes(q)
 );
 }
 return true;
 });
 }, [courses, filter, search]);

 const counts = useMemo(
 () => ({
 total: courses.length,
 published: courses.filter((c) => c.isPublished).length,
 draft: courses.filter((c) => !c.isPublished).length,
 }),
 [courses]
 );

 return (
 <>
 <div className="flex flex-col gap-4">
 <Header
 counts={counts}
 onCreate={() => setCreateOpen(true)}
 />
 <Toolbar
 filter={filter}
 setFilter={setFilter}
 search={search}
 setSearch={setSearch}
 />
 <CoursesTable courses={visible} />
 </div>
 <CreateCourseModal
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
 counts: { total: number; published: number; draft: number };
 onCreate: () => void;
}) {
 return (
 <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
 <div>
 <h1 className="text-title-md font-bold text-gray-800">
 Courses
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 {counts.total} total · {counts.published} published · {counts.draft} draft.
 Faculty curate; admin oversees.
 </p>
 </div>
 <Button
 variant="fellowship" size="sm" startIcon={<PlusIcon />}
 onClick={onCreate}
 >
 Create course
 </Button>
 </div>
 );
}

type ToolbarProps = {
 filter: FilterId;
 setFilter: (f: FilterId) => void;
 search: string;
 setSearch: (s: string) => void;
};

function Toolbar({ filter, setFilter, search, setSearch }: ToolbarProps) {
 return (
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <input
 type="search" value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search courses or faculty…" className="h-10 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-none focus:ring-3 focus:ring-fellowship-navy/10 sm:max-w-xs"/>
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
 );
}

function CoursesTable({ courses }: { courses: Course[] }) {
 if (courses.length === 0) {
 return (
 <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
 No courses match.
 </div>
 );
 }

 return (
 // No `overflow-hidden` — would clip the row-action dropdown.
 // No inner `overflow-x-auto` — `table-fixed` keeps content in
 // bounds via per-column widths declared in the colgroup below.
 <div className="rounded-2xl border border-gray-200 bg-white">
 <Table className="w-full table-fixed">
 <colgroup>
   <col />
   <col className="w-[22%]" />
   <col className="w-[180px]" />
   <col className="w-[120px]" />
   <col className="w-[110px]" />
   <col className="w-[56px]" />
 </colgroup>
 <TableHeader className="border-b border-gray-100">
 <TableRow>
 <Th>Course</Th>
 <Th>Owner</Th>
 <Th>Modules</Th>
 <Th>Status</Th>
 <Th>Updated</Th>
 <Th right>
 <span className="sr-only">Actions</span>
 </Th>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-gray-100">
 {courses.map((c) => (
 <TableRow
 key={c.id}
 className="hover:bg-gray-50">
 <Td>
 <div className="min-w-0">
 <Link
 href={`/courses/${c.id}`}
 className="block truncate text-sm font-semibold text-gray-800 hover:text-fellowship-navy">
 {c.title}
 </Link>
 <span className="mt-0.5 block truncate text-xs text-gray-500">
 {c.description}
 </span>
 </div>
 </Td>
 <Td>
 <div className="flex items-center gap-2 min-w-0">
 <AvatarText name={c.ownerName} className="h-8 w-8 shrink-0 text-xs"/>
 <span className="truncate text-sm text-gray-700">
 {c.ownerName}
 </span>
 </div>
 </Td>
 <Td>
 <ModulesProgress
 published={c.publishedModuleCount}
 total={c.moduleCount}
 />
 </Td>
 <Td>
 {c.isPublished ? (
 <Badge color="success">Published</Badge>
 ) : (
 <Badge color="light">Draft</Badge>
 )}
 </Td>
 <Td>
 <span className="truncate text-sm text-gray-500">
 {relativeDays(c.updatedAt)}
 </span>
 </Td>
 <Td right>
 <RowActions course={c} />
 </Td>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 );
}

function ModulesProgress({
 published,
 total,
}: {
 published: number;
 total: number;
}) {
 const pct = total === 0 ? 0 : Math.round((published / total) * 100);
 return (
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
 <div
 className="h-full rounded-full bg-fellowship-navy" style={{ width:`${pct}%`}}
 />
 </div>
 <span className="text-xs font-medium tabular-nums text-gray-600">
 {published} / {total}
 </span>
 </div>
 );
}

function RowActions({ course }: { course: Course }) {
 const router = useRouter();
 const [open, setOpen] = useState(false);
 const [busy, setBusy] = useState(false);
 const { confirm, dialog: confirmDialog } = useConfirm();

 const togglePublish = async () => {
 setBusy(true);
 try {
 await updateCourse(course.id, { isPublished: !course.isPublished });
 router.refresh();
 } catch {
 // ignore — backend may be offline
 } finally {
 setBusy(false);
 setOpen(false);
 }
 };

 const handleDelete = async () => {
 setOpen(false);
 const ok = await confirm({
 title: `Delete "${course.title}"?`,
 message: "This can't be undone. The course and its modules will be removed.",
 confirmLabel: "Delete course",
 tone: "danger",
 });
 if (!ok) return;
 setBusy(true);
 try {
 await deleteCourse(course.id);
 toast.success("Course deleted");
 router.refresh();
 } catch (err) {
 toast.errorFromException("Couldn't delete the course", err);
 } finally {
 setBusy(false);
 }
 };

 return (
 <div className="relative inline-block text-left">
 <button
 type="button" aria-label={`Actions for ${course.title}`}
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
 <li role="none">
 <DropdownItem
 tag="a" href={`/courses/${course.id}`}
 onItemClick={() => setOpen(false)}
 baseClassName="block w-full rounded-md text-left px-3 py-2 text-sm font-medium transition-colors" className="text-gray-700 hover:bg-gray-100 hover:text-gray-900">
 Open course
 </DropdownItem>
 </li>
 <li role="none">
 <button
 type="button" onClick={togglePublish} disabled={busy}
 className="block w-full rounded-md text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50">
 {course.isPublished ? "Unpublish" : "Publish"}
 </button>
 </li>
 <li role="none">
 <button
 type="button" onClick={handleDelete} disabled={busy}
 className="block w-full rounded-md text-left px-3 py-2 text-sm font-medium text-error-600 hover:bg-error-50 disabled:opacity-50">
 Delete
 </button>
 </li>
 </ul>
 </Dropdown>
 {confirmDialog}
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

function relativeDays(iso: string): string {
 const days = Math.round(
 (Date.now() - new Date(iso).getTime()) / 86_400_000
 );
 if (days <= 0) return "Today";
 if (days === 1) return "Yesterday";
 if (days < 30) return `${days}d ago`;
 if (days < 365) return `${Math.round(days / 30)}mo ago`;
 return `${Math.round(days / 365)}y ago`;
}
