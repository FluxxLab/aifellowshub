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
import { MoreDotIcon, PlusIcon } from "@/icons";
import InviteModal from "./InviteModal";
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

const FELLOW_FILTERS: { id:"all"| FellowStatus; label: string }[] = [
 { id:"all", label:"All"},
 { id:"active", label:"Active"},
 { id:"at-risk", label:"At-risk"},
 { id:"inactive", label:"Inactive"},
];

type ParticipantsListProps = {
 data: Participants;
};

export default function ParticipantsList({ data }: ParticipantsListProps) {
 const router = useRouter();
 const params = useSearchParams();

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
 />
 <TabPanel
 tab={tab}
 data={data}
 search={search}
 fellowFilter={fellowFilter}
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

function PageHeader({ onInvite }: { onInvite: () => void }) {
 return (
 <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
};

function Toolbar({
 tab,
 search,
 setSearch,
 fellowFilter,
 setFellowFilter,
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

 {tab ==="fellows"&& (
 <div className="flex flex-wrap gap-2">
 {FELLOW_FILTERS.map((f) => (
 <button
 key={f.id}
 onClick={() => setFellowFilter(f.id)}
 className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
 fellowFilter === f.id
 ?"bg-fellowship-navy text-white":"border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
 >
 {f.label}
 </button>
 ))}
 </div>
 )}
 </div>
 );
}

type TabPanelProps = {
 tab: TabId;
 data: Participants;
 search: string;
 fellowFilter: (typeof FELLOW_FILTERS)[number]["id"];
};

function TabPanel({ tab, data, search, fellowFilter }: TabPanelProps) {
 const q = search.trim().toLowerCase();
 const matchesSearch = (s: string) => !q || s.toLowerCase().includes(q);

 if (tab ==="fellows") {
 const fellows = data.fellows.filter((f) => {
 if (fellowFilter !=="all"&& f.status !== fellowFilter) return false;
 return matchesSearch(f.fullName) || matchesSearch(f.email);
 });
 return <FellowsTable fellows={fellows} />;
 }
 if (tab ==="faculty") {
 const faculty = data.faculty.filter(
 (f) => matchesSearch(f.fullName) || matchesSearch(f.email)
 );
 return <FacultyTable faculty={faculty} />;
 }
 if (tab ==="mentors") {
 const mentors = data.mentors.filter(
 (m) => matchesSearch(m.fullName) || matchesSearch(m.email)
 );
 return <MentorsTable mentors={mentors} />;
 }
 if (tab ==="admins") {
 const admins = data.admins.filter(
 (a) => matchesSearch(a.fullName) || matchesSearch(a.email)
 );
 return <AdminsTable admins={admins} />;
 }
 const waitlist = data.waitlist.filter(
 (w) => matchesSearch(w.fullName) || matchesSearch(w.email)
 );
 return <WaitlistTable waitlist={waitlist} />;
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

function FellowsTable({ fellows }: { fellows: Fellow[] }) {
 if (fellows.length === 0) return <EmptyState label="No fellows match."/>;
 return (
 <>
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
 status={<FellowStatusBadge status={f.status} />}
 stats={[
 { label: "Sector", value: f.sector },
 { label: "Mentor", value: f.mentor ?? "Unassigned" },
 { label: "Progress", value: `${f.progressPercent}%` },
 { label: "Attendance", value: `${f.attendanceRate}%` },
 ]}
 actions={
 <RowActions
 label={`Actions for ${f.fullName}`}
 actions={[
 { label: "View profile", href: `/participants/${f.id}` },
 { label: "Edit" },
 { label: "Delete", destructive: true },
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
 {f.sector}
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
 <FellowStatusBadge status={f.status} />
 </TableCell>
 <ActionsCell>
 <RowActions
 label={`Actions for ${f.fullName}`}
 actions={[
 { label:"View profile", href:`/participants/${f.id}`},
 { label:"Edit"},
 { label:"Delete", destructive: true },
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

function FacultyTable({ faculty }: { faculty: Faculty[] }) {
 if (faculty.length === 0) return <EmptyState label="No faculty match."/>;
 return (
 <>
 <MobileRowList>
 {faculty.map((f) => (
 <MobileRowCard
 key={f.id}
 header={
 <div className="flex items-center gap-3">
 <AvatarText name={f.fullName} className="h-9 w-9"/>
 <div className="min-w-0">
 <span className="block truncate text-sm font-semibold text-gray-800">
 {f.fullName}
 </span>
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
 { label: "View courses", href: `/courses?owner=${f.id}` },
 { label: "Edit" },
 { label: "Delete", destructive: true },
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
 <HeaderCell>Expertise</HeaderCell>
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
 <span className="block text-sm font-semibold text-gray-800">
 {f.fullName}
 </span>
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
 { label:"View courses", href:`/courses?owner=${f.id}`},
 { label:"Edit"},
 { label:"Delete", destructive: true },
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

function MentorsTable({ mentors }: { mentors: Mentor[] }) {
 if (mentors.length === 0) return <EmptyState label="No mentors match."/>;
 return (
 <>
 <MobileRowList>
 {mentors.map((m) => (
 <MobileRowCard
 key={m.id}
 header={
 <div className="flex items-center gap-3">
 <AvatarText name={m.fullName} className="h-9 w-9"/>
 <div className="min-w-0">
 <span className="block truncate text-sm font-semibold text-gray-800">
 {m.fullName}
 </span>
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
 <RowActions
 label={`Actions for ${m.fullName}`}
 actions={[
 { label: "Edit" },
 { label: "Delete", destructive: true },
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
 <HeaderCell>Mentor</HeaderCell>
 <HeaderCell>Expertise</HeaderCell>
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
 <span className="block text-sm font-semibold text-gray-800">
 {m.fullName}
 </span>
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
 <RowActions
 label={`Actions for ${m.fullName}`}
 actions={[
 { label:"Edit"},
 { label:"Delete", destructive: true },
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

function AdminsTable({ admins }: { admins: AdminUser[] }) {
 if (admins.length === 0) return <EmptyState label="No admins match."/>;
 return (
 <>
 <MobileRowList>
 {admins.map((a) => (
 <MobileRowCard
 key={a.id}
 header={
 <div className="flex items-center gap-3">
 <AvatarText name={a.fullName} className="h-9 w-9"/>
 <div className="min-w-0">
 <span className="block truncate text-sm font-semibold text-gray-800">
 {a.fullName}
 </span>
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
 { label: "Edit" },
 { label: "Delete", destructive: true },
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
 <span className="block text-sm font-semibold text-gray-800">
 {a.fullName}
 </span>
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
 { label:"Edit"},
 { label:"Delete", destructive: true },
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
 actions={
 <RowActions
 label={`Actions for ${w.fullName}`}
 actions={[
 { label: "Edit" },
 { label: "Delete", destructive: true },
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
 <HeaderCell>#</HeaderCell>
 <HeaderCell>Name</HeaderCell>
 <HeaderCell>Email</HeaderCell>
 <HeaderCell>Applied</HeaderCell>
 <ActionsHeaderCell />
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
 <ActionsCell>
 <RowActions
 label={`Actions for ${w.fullName}`}
 actions={[
 { label:"Edit"},
 { label:"Delete", destructive: true },
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
