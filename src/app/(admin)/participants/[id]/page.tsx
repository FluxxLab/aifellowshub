import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import ProfileHeader from "@/components/admin/participants/profile/ProfileHeader";
import AssignMentorCard from "@/components/admin/participants/profile/AssignMentorCard";
import { getFellowProfileServer } from "@/lib/api/participants.server";
import { listMentorsForBrowseServer } from "@/lib/api/mentorship.server";
import type {
 ActivityEntry,
 AssessmentScore,
 CapstoneSnapshot,
 FellowProfile,
 ModuleProgressEntry,
 SessionAttendance,
} from "@/lib/api/participants";

type PageProps = {
 params: { id: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
 const { id } = params;
 const fellow = await getFellowProfileServer(id);
 return {
 title: fellow ?`${fellow.fullName} · Participants`:"Participant · AI Fellows LMS",
 };
}

export default async function FellowProfilePage({ params }: PageProps) {
 const { id } = params;
 const [fellow, mentors] = await Promise.all([
 getFellowProfileServer(id),
 listMentorsForBrowseServer(),
 ]);
 if (!fellow) notFound();

 return (
 <div className="flex flex-col gap-4 md:gap-6">
 <ProfileHeader fellow={fellow} />

 <div className="grid grid-cols-12 gap-4 md:gap-6">
 <div className="col-span-12 flex flex-col gap-4 xl:col-span-8 md:gap-6">
 <ProgressCard fellow={fellow} />
 <AttendanceCard sessions={fellow.recentSessions} />
 <AssessmentsCard assessments={fellow.assessments} />
 <CapstoneCard capstone={fellow.capstone} />
 </div>
 <div className="col-span-12 flex flex-col gap-4 xl:col-span-4 md:gap-6">
 <ContactCard fellow={fellow} />
 <AssignMentorCard
 fellowId={fellow.id}
 fellowSector={fellow.sector ?? null}
 assignedMentor={fellow.assignedMentor}
 hasOverride={fellow.hasMentorOverride}
 mentors={mentors}
 />
 <ActivityCard activity={fellow.activity} />
 </div>
 </div>
 </div>
 );
}

/* ---------- Cards ---------- */

function Card({
 title,
 description,
 children,
}: {
 title: string;
 description?: string;
 children: React.ReactNode;
}) {
 return (
 <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
 <header className="mb-4">
 <h2 className="text-base font-semibold text-gray-800">
 {title}
 </h2>
 {description && (
 <p className="mt-1 text-sm text-gray-500">
 {description}
 </p>
 )}
 </header>
 {children}
 </section>
 );
}

function ProgressCard({ fellow }: { fellow: FellowProfile }) {
 return (
 <Card
 title="Programme progress" description="Module completion across the 12-week curriculum.">
 <div className="mb-5">
 <div className="mb-2 flex items-center justify-between text-sm">
 <span className="font-semibold text-gray-700">
 {fellow.progressPercent}% complete
 </span>
 <span className="text-gray-500">
 {fellow.modules.filter((m) => m.status ==="completed").length} of{" "}
 {fellow.modules.length} modules
 </span>
 </div>
 <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
 <div
 className="h-full rounded-full bg-fellowship-navy" style={{ width:`${fellow.progressPercent}%`}}
 />
 </div>
 </div>

 <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
 {fellow.modules.map((m) => (
 <ModuleRow key={m.weekNumber} module={m} />
 ))}
 </ul>
 </Card>
 );
}

function ModuleRow({ module }: { module: ModuleProgressEntry }) {
 const dotColor =
 module.status ==="completed"?"bg-success-500": module.status ==="in-progress"?"bg-warning-400":"bg-gray-300";

 const textColor =
 module.status ==="locked"?"text-gray-400":"text-gray-700";

 return (
 <li className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
 <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
 <span className={`text-xs font-semibold tabular-nums ${textColor}`}>
 W{String(module.weekNumber).padStart(2,"0")}
 </span>
 <span className={`flex-1 truncate text-sm ${textColor}`}>{module.title}</span>
 {module.status ==="in-progress"&& (
 <Badge color="warning" size="sm">
 In progress
 </Badge>
 )}
 </li>
 );
}

function AttendanceCard({ sessions }: { sessions: SessionAttendance[] }) {
 return (
 <Card
 title="Recent attendance" description="Last 5 live sessions.">
 <ul className="flex flex-col gap-2">
 {sessions.map((s) => (
 <SessionRow key={s.id} session={s} />
 ))}
 </ul>
 </Card>
 );
}

function SessionRow({ session }: { session: SessionAttendance }) {
 const date = new Date(session.date).toLocaleDateString(undefined, {
 weekday:"short",
 month:"short",
 day:"numeric",
 });

 return (
 <li className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
 <span className="text-xs font-semibold tabular-nums text-fellowship-navy">
 W{String(session.weekNumber).padStart(2,"0")}
 </span>
 <span className="flex-1 truncate text-sm text-gray-700">
 {session.moduleTitle}
 </span>
 <span className="hidden text-xs text-gray-500 sm:inline">
 {date}
 </span>
 <AttendanceBadge status={session.status} />
 </li>
 );
}

function AttendanceBadge({ status }: { status: SessionAttendance["status"] }) {
 if (status ==="attended") return <Badge color="success">Attended</Badge>;
 if (status ==="excused") return <Badge color="info">Excused</Badge>;
 return <Badge color="error">Missed</Badge>;
}

function AssessmentsCard({ assessments }: { assessments: AssessmentScore[] }) {
 if (assessments.length === 0) {
 return (
 <Card title="Assessments">
 <p className="text-sm text-gray-500">
 No assessments attempted yet.
 </p>
 </Card>
 );
 }

 return (
 <Card
 title="Assessments" description="Score per module assessment.">
 <ul className="flex flex-col gap-2">
 {assessments.map((a) => (
 <li
 key={a.id}
 className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
 <span className="text-xs font-semibold tabular-nums text-fellowship-navy">
 W{String(a.weekNumber).padStart(2,"0")}
 </span>
 <span className="flex-1 truncate text-sm text-gray-700">
 {a.title}
 </span>
 <span
 className={`text-sm font-semibold tabular-nums ${
 a.passed
 ?"text-success-600":"text-error-600"}`}
 >
 {a.score}%
 </span>
 </li>
 ))}
 </ul>
 </Card>
 );
}

function CapstoneCard({ capstone }: { capstone: CapstoneSnapshot }) {
 return (
 <Card title="Capstone" description="Final project status.">
 <div className="flex flex-wrap items-center gap-2">
 <CapstoneStatusBadge status={capstone.status} />
 {capstone.title && (
 <span className="text-sm font-semibold text-gray-800">
 {capstone.title}
 </span>
 )}
 </div>
 {capstone.lastFeedback && (
 <p className="mt-3 text-sm text-gray-600">
 {capstone.lastFeedback}
 </p>
 )}
 {capstone.status ==="not-started"&& (
 <p className="mt-3 text-sm text-gray-500">
 Capstone unlocks once the fellow reaches Week 9.
 </p>
 )}
 </Card>
 );
}

function CapstoneStatusBadge({ status }: { status: CapstoneSnapshot["status"] }) {
 switch (status) {
 case "approved":
 return <Badge color="success">Approved</Badge>;
 case "under-review":
 return <Badge color="warning">Under review</Badge>;
 case "submitted":
 return <Badge color="info">Submitted</Badge>;
 case "draft":
 return <Badge color="light">Draft</Badge>;
 default:
 return <Badge color="light">Not started</Badge>;
 }
}

function ContactCard({ fellow }: { fellow: FellowProfile }) {
 return (
 <Card title="Profile">
 <dl className="flex flex-col gap-3">
 <ContactRow label="Email" value={fellow.email} />
 <ContactRow label="Country" value={fellow.country} />
 <ContactRow label="Organisation" value={fellow.organisation} />
 <ContactRow label="Job title" value={fellow.jobTitle} />
 <ContactRow label="Sector" value={fellow.sector} />
 {fellow.linkedinUrl && (
 <ContactRow
 label="LinkedIn" value={
 <a
 href={fellow.linkedinUrl}
 target="_blank" rel="noopener noreferrer" className="break-all text-fellowship-navy hover:text-fellowship-navy-dark">
 {fellow.linkedinUrl.replace(/^https?:\/\/(www\.)?/,"")}
 </a>
 }
 />
 )}
 <ContactRow label="Joined" value={new Date(fellow.joinedAt).toLocaleDateString()} />
 </dl>
 </Card>
 );
}

function ContactRow({
 label,
 value,
}: {
 label: string;
 value: React.ReactNode;
}) {
 return (
 <div className="flex flex-col gap-0.5">
 <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">
 {label}
 </dt>
 <dd className="text-sm text-gray-700">{value}</dd>
 </div>
 );
}

function ActivityCard({ activity }: { activity: ActivityEntry[] }) {
 return (
 <Card title="Recent activity">
 <ul className="flex flex-col gap-3">
 {activity.map((e) => (
 <li key={e.id} className="flex items-start gap-3">
 <span
 className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotForActivity(
 e.type
 )}`}
 />
 <div className="min-w-0 flex-1">
 <p className="text-sm text-gray-700">
 {e.message}
 </p>
 <p className="text-xs text-gray-400">
 {relativeTime(e.at)}
 </p>
 </div>
 </li>
 ))}
 </ul>
 </Card>
 );
}

function dotForActivity(type: ActivityEntry["type"]): string {
 if (type ==="session-missed") return "bg-error-400";
 if (type ==="module-complete"|| type ==="assessment-passed") return "bg-success-400";
 if (type ==="joined"|| type ==="capstone-submitted") return "bg-fellowship-navy";
 return "bg-gray-300";
}

function relativeTime(iso: string): string {
 const days = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
 if (days <= 0) return "Today";
 if (days === 1) return "Yesterday";
 if (days < 30) return `${days}d ago`;
 if (days < 365) return `${Math.round(days / 30)}mo ago`;
 return `${Math.round(days / 365)}y ago`;
}
