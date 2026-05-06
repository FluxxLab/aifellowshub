import type { Metadata } from "next";
import Link from "next/link";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  CalenderIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  PaperPlaneIcon,
  TimeIcon,
  UsersRoundIcon,
} from "@/icons";
import {
  getMentorHome,
  type CapstoneStatus,
} from "@/lib/api/fellow-capstone";
import { getMentorQueueServer } from "@/lib/api/mentor-capstone.server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export const metadata: Metadata = {
  title: "Mentor home · AI Fellows LMS",
  description:
    "Your assigned fellows, capstones awaiting your reply, and upcoming office hours (BRD §6.10).",
};

export default async function MentorHomePage() {
  const [user, home, queue] = await Promise.all([
    getCurrentUser(),
    getMentorHome(),
    getMentorQueueServer(),
  ]);
  const firstName = user.fullName.split(" ")[0];

  // Top-3 fellows awaiting Tunde's reply, ordered by recency.
  const awaiting = queue
    .filter((q) => q.awaitingMentorReply)
    .sort(
      (a, b) =>
        +new Date(b.lastActivityAt) - +new Date(a.lastActivityAt)
    )
    .slice(0, 3);

  const office = home.nextOfficeHours;
  const officeStart = new Date(office.startsAt);
  const officeDate = officeStart.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const officeTime = officeStart.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          Hi, {firstName}.
        </h1>
        <p className="mt-2 text-gray-600">
          You have{" "}
          <span className="font-semibold text-gray-800">
            {home.fellowsAssigned} fellows
          </span>{" "}
          assigned, with{" "}
          <Link
            href="/mentor/queue"
            className="font-semibold text-fellowship-navy underline-offset-2 hover:underline"
          >
            {home.awaitingReply} awaiting your reply
          </Link>
          . Office hours: {officeDate} at {officeTime}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        <StatCard
          icon={<UsersRoundIcon className="text-fellowship-navy size-5" />}
          label="Fellows assigned"
          value={String(home.fellowsAssigned)}
        />
        <StatCard
          icon={<PaperPlaneIcon className="text-fellowship-navy size-5" />}
          label="Awaiting your reply"
          value={String(home.awaitingReply)}
          intent={home.awaitingReply > 0 ? "warning" : "neutral"}
        />
        <StatCard
          icon={<CheckCircleIcon className="text-fellowship-navy size-5" />}
          label="Submitted / under review"
          value={String(home.submittedOrUnderReview)}
        />
        <StatCard
          icon={<TimeIcon className="text-fellowship-navy size-5" />}
          label="Hours this week"
          value={`${home.hoursMentoredThisWeek}h`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
        <section className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Awaiting your reply
            </h2>
            <Link
              href="/mentor/queue"
              className="inline-flex items-center gap-1 text-sm font-medium text-fellowship-navy hover:text-fellowship-navy-dark"
            >
              Full queue
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {awaiting.length === 0 ? (
            <p className="mt-4 rounded-md bg-gray-50 p-4 text-sm text-gray-500">
              You&apos;re caught up — no fellows waiting on you right now.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {awaiting.map((q) => (
                <li
                  key={q.fellowId}
                  className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <AvatarText
                    name={q.fellowName}
                    className="h-10 w-10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">
                        {q.fellowName}
                      </p>
                      <CapstoneStatusBadge status={q.status} />
                      {q.unreadFromFellow > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 px-1.5 text-xs font-semibold text-white">
                          {q.unreadFromFellow}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600 truncate">
                      {q.capstoneTitle ?? "Not yet scoped"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Last activity {relativeTime(q.lastActivityAt)} ·{" "}
                      {q.fellowCountry} · {q.sector}
                    </p>
                  </div>
                  <Link
                    href={`/mentor/capstones/${q.fellowId}`}
                    className="shrink-0"
                  >
                    <Button size="sm" variant="fellowship">
                      Reply
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="flex flex-col gap-4 md:gap-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Next office hours
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-100 text-fellowship-navy">
                <CalenderIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {office.topic}
                </p>
                <p className="text-xs text-gray-500">
                  {officeDate} · {officeTime} · {office.durationMinutes} min
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {office.rsvpCount} fellows RSVP&apos;d so far.
            </p>
            <Button size="sm" variant="outline" className="mt-3 w-full">
              Add to calendar
            </Button>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Cohort health (your fellows)
            </p>
            <dl className="mt-3 space-y-3 text-sm">
              <ProgressLine
                label="Avg module progress"
                value={home.averageFellowProgressPercent}
              />
              <ProgressLine
                label="Avg attendance"
                value={home.averageFellowAttendancePercent}
              />
            </dl>
          </section>
        </aside>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <h2 className="text-lg font-semibold text-gray-800">Recent activity</h2>
        <ul className="mt-4 divide-y divide-gray-100">
          {home.recentActivity.map((a) => (
            <li
              key={a.id}
              className="flex items-start gap-3 py-3 text-sm first:pt-0 last:pb-0"
            >
              <AvatarText name={a.fellowName} className="h-8 w-8 text-xs" />
              <div className="flex-1">
                <p className="text-gray-700">
                  <span className="font-semibold text-gray-800">
                    {a.fellowName}
                  </span>{" "}
                  · {a.message}
                </p>
                <p className="text-xs text-gray-500">{relativeTime(a.at)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  intent = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  intent?: "neutral" | "warning";
}) {
  const valueColour =
    intent === "warning" ? "text-warning-700" : "text-gray-800";
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning-100">
        {icon}
      </div>
      <p className="mt-4 text-xs text-gray-500">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold ${valueColour}`}>{value}</p>
    </div>
  );
}

function ProgressLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <dt className="text-gray-500">{label}</dt>
        <dd className="font-semibold text-gray-800">{value}%</dd>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full bg-fellowship-navy"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function CapstoneStatusBadge({ status }: { status: CapstoneStatus }) {
  const map: Record<
    CapstoneStatus,
    { color: "info" | "warning" | "success" | "error" | "light"; label: string }
  > = {
    "not-started": { color: "light", label: "Not started" },
    draft: { color: "warning", label: "Draft" },
    submitted: { color: "info", label: "Submitted" },
    "under-review": { color: "info", label: "Under review" },
    approved: { color: "success", label: "Approved" },
    returned: { color: "error", label: "Returned" },
  };
  const { color, label } = map[status];
  return (
    <Badge color={color} variant="light">
      {label}
    </Badge>
  );
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}
