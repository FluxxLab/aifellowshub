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
import { type CapstoneStatus } from "@/lib/api/fellow-capstone";
import { getMentorHomeServer } from "@/lib/api/fellow-capstone.server";
import { getMentorQueueServer } from "@/lib/api/mentor-capstone.server";
import { listMentorBookingsServer } from "@/lib/api/mentorship.server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import MentorHomeTour from "@/components/mentor/tours/MentorHomeTour";

export const metadata: Metadata = {
  title: "Mentor home · AI Fellows LMS",
  description:
    "Your assigned fellows, capstones awaiting your reply, and upcoming coaching sessions (BRD §6.10).",
};

export default async function MentorHomePage() {
  const [user, home, queue, bookings] = await Promise.all([
    getCurrentUser(),
    getMentorHomeServer(),
    getMentorQueueServer(),
    listMentorBookingsServer(),
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

  // Confirmed mentorship bookings yet to take place — soonest first.
  const now = Date.now();
  const upcomingBookings = bookings
    .filter(
      (b) =>
        b.status === "confirmed" &&
        +new Date(b.requestedStartsAt) > now,
    )
    .sort(
      (a, b) =>
        +new Date(a.requestedStartsAt) - +new Date(b.requestedStartsAt),
    )
    .slice(0, 3);

  const nextBooking = upcomingBookings[0] ?? null;
  const nextBookingLabel = nextBooking
    ? `Next coaching session: ${formatBookingWhen(nextBooking.requestedStartsAt)}`
    : null;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <MentorHomeTour />
      <div data-tour="mentor-home-heading">
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
          {nextBookingLabel ? ` . ${nextBookingLabel}.` : "."}
        </p>
      </div>

      <div
        data-tour="mentor-home-stats"
        className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
      >
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
        <section
          data-tour="mentor-home-awaiting"
          className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
        >
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
                      {q.fellowCountry} · {q.sector ?? "—"}
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
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Confirmed coaching sessions
              </p>
              <Link
                href="/mentor/requests"
                className="text-xs font-medium text-fellowship-navy hover:underline"
              >
                All
              </Link>
            </div>

            {upcomingBookings.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                No upcoming sessions. Confirmed bookings will appear here as
                fellows schedule and admins approve them.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {upcomingBookings.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-100 p-3"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning-100 text-fellowship-navy">
                      <CalenderIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {b.fellow?.fullName ?? "Fellow"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatBookingWhen(b.requestedStartsAt)} ·{" "}
                        {b.requestedDurationMinutes} min
                      </p>
                      {b.topic && (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                          {b.topic}
                        </p>
                      )}
                    </div>
                    {b.zoomJoinUrl && (
                      <a
                        href={b.zoomJoinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs font-semibold text-fellowship-navy hover:underline"
                      >
                        Join
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Your fellows
              </p>
              <Link
                href="/mentor/queue"
                className="text-xs font-medium text-fellowship-navy hover:underline"
              >
                All
              </Link>
            </div>
            {queue.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                No fellows assigned to you yet.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {queue.slice(0, 6).map((q) => (
                  <li key={q.fellowId}>
                    <Link
                      href={`/mentor/capstones/${encodeURIComponent(q.fellowId)}`}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                    >
                      <AvatarText name={q.fellowName} className="h-8 w-8 text-xs" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-800">
                          {q.fellowName}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {q.sector ?? "—"}
                        </p>
                      </div>
                      <CapstoneStatusBadge status={q.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
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

function formatBookingWhen(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, {
    timeZone: "Africa/Lagos",
    weekday: "short",
    day: "numeric",
    month: "short",
  })} · ${d.toLocaleTimeString(undefined, {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
