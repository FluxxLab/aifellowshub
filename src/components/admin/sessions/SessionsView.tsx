"use client";
import React, { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import { CalenderIcon, ListIcon, PlusIcon } from "@/icons";
import { cn } from "@/lib/utils";
import type { LiveSession, SessionStatus } from "@/lib/api/sessions";
import SessionsCalendar from "./SessionsCalendar";
import SessionsTable from "./SessionsTable";
import ScheduleSessionModal from "./ScheduleSessionModal";

const STATUS_FILTERS: {
 id:"all"| SessionStatus;
 label: string;
}[] = [
 { id:"all", label:"All"},
 { id:"scheduled", label:"Scheduled"},
 { id:"live", label:"Live"},
 { id:"ended", label:"Ended"},
 { id:"cancelled", label:"Cancelled"},
];

type SessionsViewProps = {
 sessions: LiveSession[];
};

export default function SessionsView({ sessions }: SessionsViewProps) {
 const [view, setView] = useState<"calendar"|"list">("calendar");
 const [statusFilter, setStatusFilter] =
 useState<(typeof STATUS_FILTERS)[number]["id"]>("all");
 const [scheduleOpen, setScheduleOpen] = useState(false);

 const filteredSessions = useMemo(() => {
 if (statusFilter ==="all") return sessions;
 return sessions.filter((s) => s.status === statusFilter);
 }, [sessions, statusFilter]);

 return (
 <>
 <div className="flex flex-col gap-4">
 <Header onSchedule={() => setScheduleOpen(true)} />
 <Toolbar
 view={view}
 setView={setView}
 statusFilter={statusFilter}
 setStatusFilter={setStatusFilter}
 />
 {view ==="calendar"? (
 <SessionsCalendar sessions={filteredSessions} />
 ) : (
 <SessionsTable sessions={filteredSessions} />
 )}
 </div>
 <ScheduleSessionModal
 isOpen={scheduleOpen}
 onClose={() => setScheduleOpen(false)}
 />
 </>
 );
}

function Header({ onSchedule }: { onSchedule: () => void }) {
 return (
 <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
 <div>
 <h1 className="text-title-md font-bold text-gray-800">
 Sessions
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 Schedule and monitor live sessions across the cohort. Sessions are
 live-only — no recordings.
 </p>
 </div>
 <Button
 variant="fellowship" size="sm" startIcon={<PlusIcon />}
 onClick={onSchedule}
 >
 Schedule session
 </Button>
 </div>
 );
}

type ToolbarProps = {
 view:"calendar"|"list";
 setView: (v:"calendar"|"list") => void;
 statusFilter: (typeof STATUS_FILTERS)[number]["id"];
 setStatusFilter: (s: (typeof STATUS_FILTERS)[number]["id"]) => void;
};

function Toolbar({ view, setView, statusFilter, setStatusFilter }: ToolbarProps) {
 return (
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
 <ViewButton
 active={view ==="calendar"}
 onClick={() => setView("calendar")}
 icon={<CalenderIcon className="h-4 w-4"/>}
 label="Calendar"/>
 <ViewButton
 active={view ==="list"}
 onClick={() => setView("list")}
 icon={<ListIcon className="h-4 w-4"/>}
 label="List"/>
 </div>

 <div className="flex flex-wrap gap-2">
 {STATUS_FILTERS.map((f) => (
 <button
 key={f.id}
 onClick={() => setStatusFilter(f.id)}
 className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
 statusFilter === f.id
 ?"bg-fellowship-navy text-white":"border border-gray-200 bg-white text-gray-600 hover:bg-gray-50")}
 >
 {f.label}
 </button>
 ))}
 </div>
 </div>
 );
}

function ViewButton({
 active,
 onClick,
 icon,
 label,
}: {
 active: boolean;
 onClick: () => void;
 icon: React.ReactNode;
 label: string;
}) {
 return (
 <button
 type="button" onClick={onClick}
 aria-pressed={active}
 className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
 active
 ?"bg-fellowship-navy text-white":"text-gray-600 hover:text-gray-900")}
 >
 {icon}
 {label}
 </button>
 );
}
