"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { MoreDotIcon, PlusIcon } from "@/icons";
import InviteModal from "./InviteModal";
import AssignFellowsModal from "./profile/AssignFellowsModal";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import type {
 Participants,
 Fellow,
 Faculty,
 Mentor,
 AdminUser,
 WaitlistEntry,
 FellowStatus,
} from "@/lib/api/participants";

const TABS = [
 { id:"fellows", label:"Fellows"},
 { id:"faculty", label:"Faculty"},
 { id:"mentors", label:"Mentors"},
 { id:"admins", label:"Admins"},
 { id:"waitlist", label:"Waitlist"},
] as const;
type TabId = (typeof TABS)[number]["id"];

const FELLOW_FILTERS: { id:"all"| "pending" | FellowStatus; label: string }[] = [
 { id:"all", label:"All"},
 { id:"active", label:"Active"},
 { id:"at-risk", label:"At-risk"},
{ id: "pending", label: "Pending"},
 { id:"inactive", label:"Inactive"},

];

type ParticipantsListProps = {
 data: Participants;
};

export default function ParticipantsList({ data }: ParticipantsListProps) {
 const router = useRouter();
 const params = useSearchParams();
 const currentUser = useCurrentUser();
 const isSuperAdmin = currentUser.role === "super_admin";

 const initialTab: TabId =
 (TABS.find((t) => t.id === params.get("tab"))?.id as TabId) ??"fellows";
 const initialFilter =
 (FELLOW_FILTERS.find((f) => f.id === params.get("filter"))?.id) ??"all";

 const [tab, setTab] = useState<TabId>(initialTab);
 const [fellowFilter, setFellowFilter] =
 useState<(typeof FELLOW_FILTERS)[number]["id"]>(initialFilter);
 const [search, setSearch] = useState("");
 const [inviteOpen, setInviteOpen] = useState(false);

 // Keep URL in sync with tab + filter so the page is bookmarkable / deep-linkable.
 useEffect(() => {
 const url = new URL(window.location.href);
 url.searchParams.set("tab", tab);
 if (tab ==="fellows"&& fellowFilter !=="all") {
 url.searchParams.set("filter", fellowFilter);
 } else {
 url.searchParams.delete("filter");
 }
 router.replace(url.pathname + url.search, { scroll: false });
 }, [tab, fellowFilter, router]);

 // Build the export rows for the active tab (respecting search + filter).
 // Cheap for a cohort, so recompute on render rather than memoising.
 const exportData = participantsForExport(data, tab, search, fellowFilter);
 const handleExport = () =>
 downloadCsv(`participants-${exportData.filename}`, exportData.header, exportData.rows);

 return (
 <>
 <div className="flex flex-col gap-4">
 <PageHeader onInvite={() => setInviteOpen(true)} />
 <TabBar tab={tab} setTab={setTab} counts={countsFor(data)} />
 <Toolbar
 tab={tab}
 search={search}
 setSearch={setSearch}
 fellowFilter={fellowFilter}
 setFellowFilter={setFellowFilter}
 onExport={handleExport}
 exportCount={exportData.rows.length}
 />
 <TabPanel
 tab={tab}
 data={data}
 search={search}
 fellowFilter={fellowFilter}
 isSuperAdmin={isSuperAdmin}
 />
 </div>
 <InviteModal
 isOpen={inviteOpen}
 onClose={() => setInviteOpen(false)}
 />
 </>
 );
}

function countsFor(data: Participants) {
 return {
 fellows: data.fellows.length,
 faculty: data.faculty.length,
 mentors: data.mentors.length,
 admins: data.admins.length,
 waitlist: data.waitlist.length,
 };
}

/**
 * Soft-delete helper: shows a confirmation dialog, calls the matching
 * deactivate/reactivate endpoint, toasts the result, and refreshes the
 * list. Backend rejects self-deactivation and last-super-admin
 * deactivation — those errors surface via the toast.
 */
function useDeactivateUser() {
 const router = useRouter();
 const { confirm, dialog } = useConfirm();
 async function run(user: { id: string; fullName: string; isActive: boolean }) {
 const ok = await confirm({
 title: user.isActive ? "Deactivate this user?" : "Reactivate this user?",
 message: user.isActive
 ? `${user.fullName} will lose access to the LMS immediately. Their data is preserved and you can reactivate later.`
 : `${user.fullName} will regain access to the LMS.`,
 confirmLabel: user.isActive ? "Deactivate" : "Reactivate",
 tone: user.isActive ? "danger" : undefined,
 });
 if (!ok) return;
 try {
 await apiFetch(
 `/admin/users/${encodeURIComponent(user.id)}/${
 user.isActive ? "deactivate" : "reactivate"
 }`,
 { method: "PATCH" },
 );
 toast.success(user.isActive ? "User deactivated" : "User reactivated");
 router.refresh();
 } catch (err) {
 toast.errorFromException(
 user.isActive ? "Couldn't deactivate" : "Couldn't reactivate",
 err,
 );
 }
 }
 return { dialog, run };
}

type DeactivateRunner = ReturnType<typeof useDeactivateUser>["run"];

function deactivateAction(
 user: { id: string; fullName: string; isActive: boolean },
 run: DeactivateRunner,
) {
 return {
 label: user.isActive ? "Deactivate" : "Reactivate",
 onClick: () => run(user),
 destructive: user.isActive,
 };
}

function useDeleteUser() {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  async function run(user: { id: string; fullName: string }) {
    const ok = await confirm({
      title: "Permanently delete this user?",
      message: `This will remove ${user.fullName} and all their data from the system. This cannot be undone.`,
      confirmLabel: "Delete permanently",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await apiFetch(`/admin/users/${encodeURIComponent(user.id)}`, {
        method: "DELETE",
      });
      toast.success(`${user.fullName} deleted`);
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't delete user", err);
    }
  }
  return { dialog, run };
}

type DeleteRunner = ReturnType<typeof useDeleteUser>["run"];

function PageHeader({ onInvite }: { onInvite: () => void }) {
 return (
 <div
 data-tour="participants-heading"
 className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
 <div>
 <h1 className="text-title-md font-bold text-gray-800">
 Participants
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 Manage fellows, faculty, mentors, admins, and the cohort waitlist.
 </p>
 </div>
 <Button
 variant="fellowship" size="sm" startIcon={<PlusIcon />}
 onClick={onInvite}
 data-tour="participants-invite"
 >
 Invite team member
 </Button>
 </div>
 );
}

type TabBarProps = {
 tab: TabId;
 setTab: (t: TabId) => void;
 counts: Record<TabId, number>;
};

function TabBar({ tab, setTab, counts }: TabBarProps) {
 return (
 <div
 role="tablist" className="flex gap-1 overflow-x-auto border-b border-gray-200">
 {TABS.map((t) => {
 const active = tab === t.id;
 return (
 <button
 key={t.id}
 role="tab" aria-selected={active}
 onClick={() => setTab(t.id)}
 className={`relative -mb-px flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
 active
 ?"border-b-2 border-fellowship-navy text-fellowship-navy":"border-b-2 border-transparent text-gray-500 hover:text-gray-700"}`}
 >
 <span>{t.label}</span>
 <span
 className={`rounded-full px-2 py-0.5 text-xs font-medium ${
 active
 ?"bg-fellowship-navy text-white":"bg-gray-100 text-gray-600"}`}
 >
 {counts[t.id]}
 </span>
 </button>
 );
 })}
 </div>
 );
}

type ToolbarProps = {
 tab: TabId;
 search: string;
 setSearch: (s: string) => void;
 fellowFilter: (typeof FELLOW_FILTERS)[number]["id"];
 setFellowFilter: (f: (typeof FELLOW_FILTERS)[number]["id"]) => void;
 onExport: () => void;
 exportCount: number;
};

function Toolbar({
 tab,
 search,
 setSearch,
 fellowFilter,
 setFellowFilter,
 onExport,
 exportCount,
}: ToolbarProps) {
 return (
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div className="relative w-full sm:max-w-xs">
 <input
 type="search" value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder={`Search ${tab}…`}
 className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-none focus:ring-3 focus:ring-fellowship-navy/10"/>
 <svg
 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 fill-gray-400" viewBox="0 0 20 20">
 <path
 fillRule="evenodd" clipRule="evenodd" d="M3 9.4A6.4 6.4 0 1 1 14.4 13.4l3 3-1 1-3-3A6.4 6.4 0 0 1 3 9.4Zm6.4-4.9a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8Z"/>
 </svg>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 {tab ==="fellows"&& (
 FELLOW_FILTERS.map((f) => (
 <button
 key={f.id}
 onClick={() => setFellowFilter(f.id)}
 className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
 fellowFilter === f.id
 ?"bg-fellowship-navy text-white":"border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
 >
 {f.label}
 </button>
 ))
 )}
 <button
 type="button"
 onClick={onExport}
 disabled={exportCount === 0}
 title={`Export the ${exportCount} ${tab} currently shown to CSV`}
 className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
 >
 <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
 </svg>
 Export CSV
 </button>
 </div>
 </div>
 );
}

type TabPanelProps = {
 tab: TabId;
 data: Participants;
 search: string;
 fellowFilter: (typeof FELLOW_FILTERS)[number]["id"];
 isSuperAdmin: boolean;
};

/** 25 rows per page across all five participant tables. Big enough
 *  to fit a typical cohort segment on one screen at desktop widths,
 *  small enough that mobile users aren't scrolling forever before
 *  hitting the page-controls strip. */
const PAGE_SIZE = 25;

function TabPanel({ tab, data, search, fellowFilter, isSuperAdmin }: TabPanelProps) {
 const q = search.trim().toLowerCase();
 const matchesSearch = (s: string) => !q || s.toLowerCase().includes(q);

 // Reset to page 1 whenever the active tab, filter, or search query
 // changes — otherwise a user on "Fellows page 3" who switches to
 // "Faculty" (4 rows) sees an empty table.
 const [page, setPage] = useState(1);
 useEffect(() => {
   setPage(1);
 }, [tab, fellowFilter, search]);

  

 if (tab ==="fellows") {
 const fellows = data.fellows.filter((f) => {
 if (fellowFilter ==="pending"&& !f.pending) return false;
 if (fellowFilter !=="all"&& fellowFilter !=="pending"&& f.status !== fellowFilter) return false;
  return matchesSearch(f.fullName) || matchesSearch(f.email);
 });
 return (
   <Paginated
     items={fellows}
     page={page}
     onPageChange={setPage}
     render={(rows) => <FellowsTable fellows={rows} isSuperAdmin={isSuperAdmin} />}
   />
 );
 }
 if (tab ==="faculty") {
 const faculty = data.faculty.filter(
 (f) => matchesSearch(f.fullName) || matchesSearch(f.email)
 );
 return (
   <Paginated
     items={faculty}
     page={page}
     onPageChange={setPage}
     render={(rows) => <FacultyTable faculty={rows} isSuperAdmin={isSuperAdmin} />}
   />
 );
 }
 if (tab ==="mentors") {
 const mentors = data.mentors.filter(
 (m) => matchesSearch(m.fullName) || matchesSearch(m.email)
 );
 return (
   <Paginated
     items={mentors}
     page={page}
     onPageChange={setPage}
     render={(rows) => <MentorsTable mentors={rows} isSuperAdmin={isSuperAdmin} />}
   />
 );
 }
 if (tab ==="admins") {
 const admins = data.admins.filter(
 (a) => matchesSearch(a.fullName) || matchesSearch(a.email)
 );
 return (
   <Paginated
     items={admins}
     page={page}
     onPageChange={setPage}
     render={(rows) => <AdminsTable admins={rows} isSuperAdmin={isSuperAdmin} />}
   />
 );
 }
 const waitlist = data.waitlist.filter(
 (w) => matchesSearch(w.fullName) || matchesSearch(w.email)
 );
 return (
   <Paginated
     items={waitlist}
     page={page}
     onPageChange={setPage}
     render={(rows) => <WaitlistTable waitlist={rows} />}
   />
 );
}

/** Generic pagination wrapper — slices a page out of `items`, passes
 *  it to `render`, and shows a Prev/Next strip with the current
 *  range below the table. Hides the strip entirely when everything
 *  fits on one page so small lists don't show pointless chrome. */
function Paginated<T>({
  items,
  page,
  onPageChange,
  render,
}: {
  items: T[];
  page: number;
  onPageChange: (p: number) => void;
  render: (rows: T[]) => React.ReactNode;
}) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const slice = items.slice(start, start + PAGE_SIZE);
  const from = total === 0 ? 0 : start + 1;
  const to = Math.min(start + PAGE_SIZE, total);

  return (
    <div className="flex flex-col gap-4">
      {render(slice)}
      {pageCount > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-700">{from}–{to}</span> of{" "}
            <span className="font-semibold text-gray-700">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(safePage - 1)}
              disabled={safePage <= 1}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ‹ Prev
            </button>
            <span className="text-xs text-gray-500">
              Page <span className="font-semibold text-gray-700">{safePage}</span> of{" "}
              <span className="font-semibold text-gray-700">{pageCount}</span>
            </span>
            <button
              type="button"
              onClick={() => onPageChange(safePage + 1)}
              disabled={safePage >= pageCount}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Tables ---------- */

function TableShell({ children }: { children: React.ReactNode }) {
 return (
 <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white md:block">
 <div className="max-w-full overflow-x-auto">{children}</div>
 </div>
 );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
 return (
 <TableCell
 isHeader
 className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 sm:px-6">
 {children}
 </TableCell>
 );
}

function ActionsHeaderCell() {
 return (
 <TableCell
 isHeader
 className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 sm:px-6">
 <span className="sr-only">Actions</span>
 </TableCell>
 );
}

function ActionsCell({ children }: { children: React.ReactNode }) {
 return (
 <TableCell className="px-5 py-4 text-right sm:px-6">{children}</TableCell>
 );
}

type RowAction = {
 label: string;
 href?: string;
 onClick?: () => void;
 destructive?: boolean;
};

function RowActions({
 label,
 actions,
}: {
 label: string;
 actions: RowAction[];
}) {
 const [open, setOpen] = useState(false);

 return (
 <div className="relative inline-block text-left">
 <button
 type="button" aria-label={label}
 aria-haspopup="menu" aria-expanded={open}
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
 portal
 className="w-44 p-1">
 <ul role="menu" className="flex flex-col gap-0.5">
 {actions.map((a, i) => (
 <li key={i} role="none">
 <DropdownItem
 tag={a.href ?"a":"button"}
 href={a.href}
 onClick={a.onClick}
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

/**
 * Mentor row actions — the shared RowActions menu plus an "Assign fellows"
 * item that opens the pin-fellows modal. Wrapped in its own component so the
 * modal's open state lives per-row.
 */
function MentorRowActions({
  mentor,
  run,
  runDelete,
  isSuperAdmin,
}: {
  mentor: Mentor;
  run: DeactivateRunner;
  runDelete: DeleteRunner;
  isSuperAdmin: boolean;
}) {
  const [assignOpen, setAssignOpen] = useState(false);
  return (
    <>
      <RowActions
        label={`Actions for ${mentor.fullName}`}
        actions={[
          { label: "View profile", href: `/participants/${mentor.id}` },
          { label: "Assign fellows", onClick: () => setAssignOpen(true) },
          deactivateAction(mentor, run),
          ...(isSuperAdmin
            ? [
                {
                  label: "Delete permanently",
                  onClick: () => runDelete(mentor),
                  destructive: true,
                },
              ]
            : []),
        ]}
      />
      <AssignFellowsModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        mentorId={mentor.id}
        mentorName={mentor.fullName}
      />
    </>
  );
}

function FellowsTable({ fellows, isSuperAdmin }: { fellows: Fellow[]; isSuperAdmin: boolean }) {
 const { dialog, run } = useDeactivateUser();
 const { dialog: deleteDialog, run: runDelete } = useDeleteUser();
 if (fellows.length === 0) return <EmptyState label="No fellows match."/>;
 return (
 <>
 {dialog}
 {deleteDialog}
 <MobileRowList>
 {fellows.map((f) => (
 <MobileRowCard
 key={f.id}
 header={
 <div className="flex items-center gap-3">
 <AvatarText name={f.fullName} className="h-9 w-9"/>
 <div className="min-w-0">
 <Link
 href={`/participants/${f.id}`}
 className="block truncate text-sm font-semibold text-gray-800 hover:text-fellowship-navy">
 {f.fullName}
 </Link>
 <span className="block truncate text-xs text-gray-500">
 {f.organisation} · {f.country}
 </span>
 </div>
 </div>
 }
 status={f.pending ? <Badge color="warning"> Pending </Badge> :<FellowStatusBadge status={f.status} />}
 stats={[
 { label: "Sector", value: f.sector ?? "No sector" },
 { label: "Mentor", value: f.mentor ?? "Unassigned" },
 { label: "Progress", value: `${f.progressPercent}%` },
 { label: "Attendance", value: `${f.attendanceRate}%` },
 ]}
 actions={
 <RowActions
 label={`Actions for ${f.fullName}`}
 actions={[
 { label: "View profile", href: `/participants/${f.id}` },
 deactivateAction(f, run),
 ...(isSuperAdmin ? [{ label: "Delete permanently", onClick: () => runDelete(f), destructive: true }] : []),
 ]}
 />
 }
 />
 ))}
 </MobileRowList>
 <TableShell>
 <Table>
 <TableHeader className="border-b border-gray-100">
 <TableRow>
 <HeaderCell>Fellow</HeaderCell>
 <HeaderCell>Sector</HeaderCell>
 <HeaderCell>Mentor</HeaderCell>
 <HeaderCell>Progress</HeaderCell>
 <HeaderCell>Attendance</HeaderCell>
 <HeaderCell>Status</HeaderCell>
 <ActionsHeaderCell />
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-gray-100">
 {fellows.map((f) => (
 <TableRow
 key={f.id}
 className="hover:bg-gray-50">
 <TableCell className="px-5 py-4 sm:px-6">
 <div className="flex items-center gap-3">
 <AvatarText name={f.fullName} className="h-9 w-9"/>
 <div>
 <Link
 href={`/participants/${f.id}`}
 className="block text-sm font-semibold text-gray-800 hover:text-fellowship-navy">
 {f.fullName}
 </Link>
 <span className="block text-xs text-gray-500">
 {f.organisation} · {f.country}
 </span>
 </div>
 </div>
 </TableCell>
 <TableCell className="px-5 py-4 text-sm text-gray-600">
 {f.sector ?? (
 <span className="italic text-gray-400">No sector</span>
 )}
 </TableCell>
 <TableCell className="px-5 py-4 text-sm text-gray-600">
 {f.mentor ?? (
 <span className="italic text-gray-400">Unassigned</span>
 )}
 </TableCell>
 <TableCell className="px-5 py-4 text-sm text-gray-700 tabular-nums">
 {f.progressPercent}%
 </TableCell>
 <TableCell className="px-5 py-4 text-sm text-gray-700 tabular-nums">
 {f.attendanceRate}%
 </TableCell>
 <TableCell className="px-5 py-4">
 {f.pending ? <Badge color="warning">Pending</Badge> : <FellowStatusBadge status={f.status} />}
 </TableCell>
 <ActionsCell>
 <RowActions
 label={`Actions for ${f.fullName}`}
 actions={[
 { label:"View profile", href:`/participants/${f.id}`},
 deactivateAction(f, run),
 ...(isSuperAdmin ? [{ label: "Delete permanently", onClick: () => runDelete(f), destructive: true }] : []),
 ]}
 />
 </ActionsCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableShell>
 </>
 );
}

function FellowStatusBadge({ status }: { status: FellowStatus }) {
 if (status ==="active") return <Badge color="success">Active</Badge>;
 if (status ==="at-risk") return <Badge color="error">At-risk</Badge>;
 return <Badge color="light">Inactive</Badge>;
}

function FacultyTable({ faculty, isSuperAdmin }: { faculty: Faculty[]; isSuperAdmin: boolean }) {
 const { dialog, run } = useDeactivateUser();
 const { dialog: deleteDialog, run: runDelete } = useDeleteUser();
 if (faculty.length === 0) return <EmptyState label="No faculty match."/>;
 return (
 <>
 {deleteDialog}
 {dialog}
 <MobileRowList>
 {faculty.map((f) => (
 <MobileRowCard
 key={f.id}
 header={
 <div className="flex items-center gap-3">
 <AvatarText name={f.fullName} className="h-9 w-9"/>
 <div className="min-w-0">
 <Link
 href={`/participants/${f.id}`}
 className="block truncate text-sm font-semibold text-gray-800 hover:text-fellowship-navy">
 {f.fullName}
 </Link>
 <span className="block truncate text-xs text-gray-500">
 {f.email}
 </span>
 </div>
 </div>
 }
 status={
 f.isActive ? (
 <Badge color="success">Active</Badge>
 ) : (
 <Badge color="light">Inactive</Badge>
 )
 }
 meta={
 f.expertise.length > 0 ? (
 <div className="flex flex-wrap gap-1">
 {f.expertise.map((s) => (
 <Badge key={s} color="light">
 {s}
 </Badge>
 ))}
 </div>
 ) : null
 }
 stats={[
 { label: "Modules owned", value: f.ownedModulesCount },
 {
 label: "In draft",
 value:
 f.draftModulesCount > 0 ? (
 <Badge color="warning">{f.draftModulesCount}</Badge>
 ) : (
 "0"
 ),
 },
 ]}
 actions={
 <RowActions
 label={`Actions for ${f.fullName}`}
 actions={[
 { label: "View profile", href: `/participants/${f.id}` },
 { label: "View courses", href: `/courses?owner=${f.id}` },
 deactivateAction(f, run),
 ...(isSuperAdmin ? [{ label: "Delete permanently", onClick: () => runDelete(f), destructive: true }] : []),
 ]}
 />
 }
 />
 ))}
 </MobileRowList>
 <TableShell>
 <Table>
 <TableHeader className="border-b border-gray-100">
 <TableRow>
 <HeaderCell>Faculty</HeaderCell>
 <HeaderCell>Sector</HeaderCell>
 <HeaderCell>Modules owned</HeaderCell>
 <HeaderCell>In draft</HeaderCell>
 <HeaderCell>Status</HeaderCell>
 <ActionsHeaderCell />
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-gray-100">
 {faculty.map((f) => (
 <TableRow
 key={f.id}
 className="hover:bg-gray-50">
 <TableCell className="px-5 py-4 sm:px-6">
 <div className="flex items-center gap-3">
 <AvatarText name={f.fullName} className="h-9 w-9"/>
 <div>
 <Link
 href={`/participants/${f.id}`}
 className="block text-sm font-semibold text-gray-800 hover:text-fellowship-navy">
 {f.fullName}
 </Link>
 <span className="block text-xs text-gray-500">
 {f.email}
 </span>
 </div>
 </div>
 </TableCell>
 <TableCell className="px-5 py-4">
 <div className="flex flex-wrap gap-1">
 {f.expertise.map((s) => (
 <Badge key={s} color="light">
 {s}
 </Badge>
 ))}
 </div>
 </TableCell>
 <TableCell className="px-5 py-4 text-sm text-gray-700 tabular-nums">
 {f.ownedModulesCount}
 </TableCell>
 <TableCell className="px-5 py-4 tabular-nums">
 {f.draftModulesCount > 0 ? (
 <Badge color="warning">{f.draftModulesCount}</Badge>
 ) : (
 <span className="text-sm text-gray-400">0</span>
 )}
 </TableCell>
 <TableCell className="px-5 py-4">
 {f.isActive ? (
 <Badge color="success">Active</Badge>
 ) : (
 <Badge color="light">Inactive</Badge>
 )}
 </TableCell>
 <ActionsCell>
 <RowActions
 label={`Actions for ${f.fullName}`}
 actions={[
 { label:"View profile", href:`/participants/${f.id}`},
 { label:"View courses", href:`/courses?owner=${f.id}`},
 deactivateAction(f, run),
 ]}
 />
 </ActionsCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableShell>
 </>
 );
}

function MentorsTable({ mentors, isSuperAdmin }: { mentors: Mentor[]; isSuperAdmin: boolean }) {
 const { dialog, run } = useDeactivateUser();
 const { dialog: deleteDialog, run: runDelete } = useDeleteUser();
 if (mentors.length === 0) return <EmptyState label="No mentors match."/>;
 return (
 <>
 {deleteDialog}
 {dialog}
 <MobileRowList>
 {mentors.map((m) => (
 <MobileRowCard
 key={m.id}
 header={
 <div className="flex items-center gap-3">
 <AvatarText name={m.fullName} className="h-9 w-9"/>
 <div className="min-w-0">
 <Link
 href={`/participants/${m.id}`}
 className="block truncate text-sm font-semibold text-gray-800 hover:text-fellowship-navy">
 {m.fullName}
 </Link>
 <span className="block truncate text-xs text-gray-500">
 {m.email}
 </span>
 </div>
 </div>
 }
 status={
 m.isActive ? (
 <Badge color="success">Active</Badge>
 ) : (
 <Badge color="light">Inactive</Badge>
 )
 }
 meta={
 m.expertise.length > 0 ? (
 <div className="flex flex-wrap gap-1">
 {m.expertise.map((s) => (
 <Badge key={s} color="light">
 {s}
 </Badge>
 ))}
 </div>
 ) : null
 }
 stats={[
 { label: "Fellows", value: m.assignedFellowsCount },
 {
 label: "Pending reviews",
 value:
 m.pendingReviewsCount > 4 ? (
 <Badge color="error">{m.pendingReviewsCount}</Badge>
 ) : (
 String(m.pendingReviewsCount)
 ),
 },
 ]}
 actions={
 <MentorRowActions
 mentor={m}
 run={run}
 runDelete={runDelete}
 isSuperAdmin={isSuperAdmin}
 />
 }
 />
 ))}
 </MobileRowList>
 <TableShell>
 <Table>
 <TableHeader className="border-b border-gray-100">
 <TableRow>
 <HeaderCell>Mentor</HeaderCell>
 <HeaderCell>Sector</HeaderCell>
 <HeaderCell>Fellows</HeaderCell>
 <HeaderCell>Pending reviews</HeaderCell>
 <HeaderCell>Status</HeaderCell>
 <ActionsHeaderCell />
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-gray-100">
 {mentors.map((m) => (
 <TableRow
 key={m.id}
 className="hover:bg-gray-50">
 <TableCell className="px-5 py-4 sm:px-6">
 <div className="flex items-center gap-3">
 <AvatarText name={m.fullName} className="h-9 w-9"/>
 <div>
 <Link
 href={`/participants/${m.id}`}
 className="block text-sm font-semibold text-gray-800 hover:text-fellowship-navy">
 {m.fullName}
 </Link>
 <span className="block text-xs text-gray-500">
 {m.email}
 </span>
 </div>
 </div>
 </TableCell>
 <TableCell className="px-5 py-4">
 <div className="flex flex-wrap gap-1">
 {m.expertise.map((s) => (
 <Badge key={s} color="light">
 {s}
 </Badge>
 ))}
 </div>
 </TableCell>
 <TableCell className="px-5 py-4 text-sm text-gray-700 tabular-nums">
 {m.assignedFellowsCount}
 </TableCell>
 <TableCell className="px-5 py-4 tabular-nums">
 {m.pendingReviewsCount > 4 ? (
 <Badge color="error">{m.pendingReviewsCount}</Badge>
 ) : (
 <span className="text-sm text-gray-700">
 {m.pendingReviewsCount}
 </span>
 )}
 </TableCell>
 <TableCell className="px-5 py-4">
 {m.isActive ? (
 <Badge color="success">Active</Badge>
 ) : (
 <Badge color="light">Inactive</Badge>
 )}
 </TableCell>
 <ActionsCell>
 <MentorRowActions
 mentor={m}
 run={run}
 runDelete={runDelete}
 isSuperAdmin={isSuperAdmin}
 />
 </ActionsCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableShell>
 </>
 );
}

function AdminsTable({ admins, isSuperAdmin }: { admins: AdminUser[]; isSuperAdmin: boolean }) {
 const { dialog, run } = useDeactivateUser();
 const { dialog: deleteDialog, run: runDelete } = useDeleteUser();
 if (admins.length === 0) return <EmptyState label="No admins match."/>;
 return (
 <>
 {deleteDialog}
 {dialog}
 <MobileRowList>
 {admins.map((a) => (
 <MobileRowCard
 key={a.id}
 header={
 <div className="flex items-center gap-3">
 <AvatarText name={a.fullName} className="h-9 w-9"/>
 <div className="min-w-0">
 <Link
 href={`/participants/${a.id}`}
 className="block truncate text-sm font-semibold text-gray-800 hover:text-fellowship-navy">
 {a.fullName}
 </Link>
 <span className="block truncate text-xs text-gray-500">
 {a.email}
 </span>
 </div>
 </div>
 }
 status={
 a.isActive ? (
 <Badge color="success">Active</Badge>
 ) : (
 <Badge color="light">Inactive</Badge>
 )
 }
 stats={[
 {
 label: "Role",
 value:
 a.role === "super_admin" ? (
 <Badge color="warning">Super admin</Badge>
 ) : (
 <Badge color="info">Admin</Badge>
 ),
 },
 { label: "Last active", value: relativeDays(a.lastActiveAt) },
 ]}
 actions={
 <RowActions
 label={`Actions for ${a.fullName}`}
 actions={[
 { label: "View profile", href: `/participants/${a.id}` },
 deactivateAction(a, run),
 ...(isSuperAdmin ? [{ label: "Delete permanently", onClick: () => runDelete(a), destructive: true }] : []),
 ]}
 />
 }
 />
 ))}
 </MobileRowList>
 <TableShell>
 <Table>
 <TableHeader className="border-b border-gray-100">
 <TableRow>
 <HeaderCell>Admin</HeaderCell>
 <HeaderCell>Role</HeaderCell>
 <HeaderCell>Last active</HeaderCell>
 <HeaderCell>Status</HeaderCell>
 <ActionsHeaderCell />
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-gray-100">
 {admins.map((a) => (
 <TableRow
 key={a.id}
 className="hover:bg-gray-50">
 <TableCell className="px-5 py-4 sm:px-6">
 <div className="flex items-center gap-3">
 <AvatarText name={a.fullName} className="h-9 w-9"/>
 <div>
 <Link
 href={`/participants/${a.id}`}
 className="block text-sm font-semibold text-gray-800 hover:text-fellowship-navy">
 {a.fullName}
 </Link>
 <span className="block text-xs text-gray-500">
 {a.email}
 </span>
 </div>
 </div>
 </TableCell>
 <TableCell className="px-5 py-4">
 {a.role ==="super_admin"? (
 <Badge color="warning">Super admin</Badge>
 ) : (
 <Badge color="info">Admin</Badge>
 )}
 </TableCell>
 <TableCell className="px-5 py-4 text-sm text-gray-500">
 {relativeDays(a.lastActiveAt)}
 </TableCell>
 <TableCell className="px-5 py-4">
 {a.isActive ? (
 <Badge color="success">Active</Badge>
 ) : (
 <Badge color="light">Inactive</Badge>
 )}
 </TableCell>
 <ActionsCell>
 <RowActions
 label={`Actions for ${a.fullName}`}
 actions={[
 { label: "View profile", href: `/participants/${a.id}` },
 deactivateAction(a, run),
 ...(isSuperAdmin ? [{ label: "Delete permanently", onClick: () => runDelete(a), destructive: true }] : []),
 ]}
 />
 </ActionsCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableShell>
 </>
 );
}

function WaitlistTable({ waitlist }: { waitlist: WaitlistEntry[] }) {
 if (waitlist.length === 0)
 return <EmptyState label="The waitlist is empty."/>;
 return (
 <>
 <MobileRowList>
 {waitlist.map((w) => (
 <MobileRowCard
 key={w.id}
 header={
 <div className="flex items-center gap-3">
 <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold tabular-nums text-gray-700">
 {w.position}
 </span>
 <AvatarText name={w.fullName} className="h-9 w-9"/>
 <div className="min-w-0">
 <span className="block truncate text-sm font-semibold text-gray-800">
 {w.fullName}
 </span>
 <span className="block truncate text-xs text-gray-500">
 {w.email}
 </span>
 </div>
 </div>
 }
 stats={[
 { label: "Applied", value: relativeDays(w.appliedAt) },
 ]}
 />
 ))}
 </MobileRowList>
 <TableShell>
 <Table>
 <TableHeader className="border-b border-gray-100">
 <TableRow>
 <HeaderCell>#</HeaderCell>
 <HeaderCell>Name</HeaderCell>
 <HeaderCell>Email</HeaderCell>
 <HeaderCell>Applied</HeaderCell>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-gray-100">
 {waitlist.map((w) => (
 <TableRow
 key={w.id}
 className="hover:bg-gray-50">
 <TableCell className="px-5 py-4 text-sm font-semibold text-gray-700 tabular-nums sm:px-6">
 {w.position}
 </TableCell>
 <TableCell className="px-5 py-4">
 <div className="flex items-center gap-3">
 <AvatarText name={w.fullName} className="h-9 w-9"/>
 <span className="text-sm font-semibold text-gray-800">
 {w.fullName}
 </span>
 </div>
 </TableCell>
 <TableCell className="px-5 py-4 text-sm text-gray-600">
 {w.email}
 </TableCell>
 <TableCell className="px-5 py-4 text-sm text-gray-500">
 {relativeDays(w.appliedAt)}
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableShell>
 </>
 );
}

function EmptyState({ label }: { label: string }) {
 return (
 <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
 {label}
 </div>
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

/* ---------- CSV export ---------- */

/**
 * Build header + rows for the active tab's CSV export, applying the same
 * search + status filter the table uses. The Fellows export carries the
 * Progress / Attendance / Status columns admins asked for.
 */
function participantsForExport(
 data: Participants,
 tab: TabId,
 search: string,
 fellowFilter: (typeof FELLOW_FILTERS)[number]["id"],
): { header: string[]; rows: string[][]; filename: string } {
 const q = search.trim().toLowerCase();
 const m = (s: string) => !q || s.toLowerCase().includes(q);

 if (tab === "fellows") {
 const list = data.fellows.filter(
 (f) =>
 (fellowFilter === "all" || (fellowFilter === "pending" ? f.pending : f.status === fellowFilter)) &&
 (m(f.fullName) || m(f.email)),
 );
 return {
 header: ["Name", "Email", "Organisation", "Country", "Sector", "Mentor", "Progress %", "Attendance %", "Status", "Onboarded"],
 rows: list.map((f) => [
 f.fullName, f.email, f.organisation, f.country, f.sector ?? "",
  f.mentor ?? "Unassigned", String(f.progressPercent), String(f.attendanceRate), f.status, f.pending ? "No" : "Yes",
  ]),
 filename: "fellows",
 };
 }
 if (tab === "faculty") {
 const list = data.faculty.filter((f) => m(f.fullName) || m(f.email));
 return {
 header: ["Name", "Email", "Expertise", "Modules owned", "In draft", "Status"],
 rows: list.map((f) => [
 f.fullName, f.email, f.expertise.join("; "),
 String(f.ownedModulesCount), String(f.draftModulesCount), f.isActive ? "Active" : "Inactive",
 ]),
 filename: "faculty",
 };
 }
 if (tab === "mentors") {
 const list = data.mentors.filter((x) => m(x.fullName) || m(x.email));
 return {
 header: ["Name", "Email", "Expertise", "Fellows", "Pending reviews", "Status"],
 rows: list.map((x) => [
 x.fullName, x.email, x.expertise.join("; "),
 String(x.assignedFellowsCount), String(x.pendingReviewsCount), x.isActive ? "Active" : "Inactive",
 ]),
 filename: "mentors",
 };
 }
 if (tab === "admins") {
 const list = data.admins.filter((x) => m(x.fullName) || m(x.email));
 return {
 header: ["Name", "Email", "Role", "Last active", "Status"],
 rows: list.map((x) => [
 x.fullName, x.email, x.role === "super_admin" ? "Super admin" : "Admin",
 x.lastActiveAt, x.isActive ? "Active" : "Inactive",
 ]),
 filename: "admins",
 };
 }
 const list = data.waitlist.filter((x) => m(x.fullName) || m(x.email));
 return {
 header: ["Position", "Name", "Email", "Applied"],
 rows: list.map((x) => [String(x.position), x.fullName, x.email, x.appliedAt]),
 filename: "waitlist",
 };
}

/** Build a CSV blob from header + rows and trigger a download. */
function downloadCsv(filename: string, header: string[], rows: string[][]): void {
 const esc = (cell: string) => `"${String(cell ?? "").replace(/"/g, '""')}"`;
 const csv = [header, ...rows].map((row) => row.map(esc).join(",")).join("\n");
 const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `${filename}.csv`;
 a.click();
 URL.revokeObjectURL(url);
}
