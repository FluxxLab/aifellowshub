import type { Metadata } from "next";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import LiveSessionAction from "@/components/fellow/LiveSessionAction";
import PastSessionsTable from "@/components/fellow/PastSessionsTable";
import SessionsTour from "@/components/fellow/tours/SessionsTour";
import ZoomSdkPrefetch from "@/components/fellow/ZoomSdkPrefetch";
import { CalenderIcon, ChevronRightIcon, TimeIcon } from "@/icons";
import { getFellowSessionsServer } from "@/lib/api/fellow-learning.server";
import type { FellowSession } from "@/lib/api/fellow-learning";

export const metadata: Metadata = {
  title: "My sessions · AI Fellows LMS",
  description:
    "Register and join live sessions for your cohort here.",
};

export default async function FellowSessionsPage() {
  const sessions = await getFellowSessionsServer();

  // Week 0 (orientation) was run outside the LMS — the placeholder
  // session row may still read "scheduled" with a future date. Pin it
  // to the "past" bucket and to the attended tally regardless of its
  // DB status, so it counts toward the cohort's attendance stats
  // instead of hiding under Upcoming where it can't ever resolve.
  const isOrientation = (s: FellowSession) => s.weekNumber <= 0;

  // A session is "actually past" only when its DB status reads
  // "ended" AND its start time is in the past. Guards against the
  // data-inconsistency case where an admin reschedules a previously-
  // ended session forward — the status stayed "ended" and the
  // attendance row stayed "missed", so the future session bled into
  // the Past table as a missed row. Now those flip back to Upcoming.
  const now = Date.now();
  const isActuallyPast = (s: FellowSession) =>
    s.status === "ended" && +new Date(s.startsAt) < now;

  const live = sessions.filter(
    (s) => s.status === "live" && !isOrientation(s),
  );
  const upcoming = sessions
    .filter(
      (s) =>
        !isOrientation(s) &&
        !isActuallyPast(s) &&
        s.status !== "live" &&
        s.status !== "cancelled",
    )
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const past = sessions
    .filter((s) => isActuallyPast(s) || isOrientation(s))
    .sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));

  // Catching up via the recording is HALF credit (the row is labelled
  // "half-credit"), so it must not count as a full attended session — otherwise
  // a fellow who watched every recording reads 100%, same as one who attended
  // every session live. Live attendance / excused = full, recording = 0.5.
  const creditFor = (s: FellowSession): number => {
    if (isOrientation(s)) return 1;
    if (s.attendanceState === "attended" || s.attendanceState === "excused") {
      return 1;
    }
    if (s.attendanceState === "attended_recording") return 0.5;
    return 0;
  };
  // Head count of sessions the fellow engaged with at all (live or recording) —
  // shown as "Attended X / Y". The RATE below is the weighted one.
  const attendedCount = past.filter(
    (s) => s.attended === true || isOrientation(s),
  ).length;
  const creditedCount = past.reduce((sum, s) => sum + creditFor(s), 0);
  const attendanceRate =
    past.length > 0 ? Math.round((creditedCount / past.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <SessionsTour />
      <ZoomSdkPrefetch />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Sessions" },
        ]}
      />
      <div data-tour="sessions-heading">
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          My sessions
        </h1>
        <p className="mt-2 text-gray-600">
          Register and join live sessions here.
        </p>
      </div>

      <section
        data-tour="sessions-stats"
        className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Total sessions" value={String(sessions.length)} />
          <Stat label="Attended" value={`${attendedCount} / ${past.length}`} />
          <Stat label="Attendance rate" value={`${attendanceRate}%`} />
          <Stat label="Upcoming" value={String(upcoming.length + live.length)} />
        </div>
      </section>

      {live.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-800">
            Live now
          </h2>
          <div className="flex flex-col gap-3">
            {live.map((s) => (
              <SessionCard key={s.weekNumber} session={s} variant="live" />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-800">
            Upcoming
          </h2>
          <div className="flex flex-col gap-3">
            {upcoming.map((s) => (
              <SessionCard key={s.weekNumber} session={s} variant="upcoming" />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-800">Past</h2>
          <PastSessionsTable sessions={past} />
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

function SessionCard({
  session: s,
  variant,
}: {
  session: FellowSession;
  variant: "live" | "upcoming";
}) {
  const start = new Date(s.startsAt);
  const dateLabel = start.toLocaleDateString(undefined, {
    timeZone: "Africa/Lagos",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeLabel = start.toLocaleTimeString(undefined, {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isLive = variant === "live";

  return (
    <div
      className={`rounded-2xl border bg-white p-5 md:p-6 ${
        isLive
          ? "border-error-200 ring-1 ring-error-100"
          : "border-gray-200"
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              isLive ? "bg-error-50 text-error-500" : "bg-warning-100 text-fellowship-navy"
            }`}
          >
            <CalenderIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Week {s.weekNumber}
              </span>
              {isLive ? (
                <Badge color="error">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-white" />
                  Live now
                </Badge>
              ) : (
                <Badge color="info" variant="light">
                  Upcoming
                </Badge>
              )}
              <span className="text-gray-300">·</span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <TimeIcon className="h-3.5 w-3.5" />
                {s.durationMinutes} min
              </span>
            </div>
            <h3 className="mt-1 text-lg font-semibold text-gray-800">
              {s.title || s.moduleTitle}
            </h3>
            {s.title && s.title !== s.moduleTitle && (
              <p className="text-sm text-gray-500">{s.moduleTitle}</p>
            )}
            <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              <div className="flex gap-2">
                <dt className="text-gray-500">When</dt>
                <dd className="text-gray-800">
                  {dateLabel} · {timeLabel}
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500">Host</dt>
                <dd className="text-gray-800">{s.hostName}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 md:w-48 md:items-stretch">
          {/*
            LiveSessionAction owns both states: when the session is live
            it renders "Join in app" + the inline Zoom embed on click;
            when it's upcoming it renders RSVP. Reusing it here keeps
            the in-app embed flow consistent with /learning/:week and
            stops the old "Join on Zoom" external link from yanking
            fellows out of the LMS.
          */}
          <LiveSessionAction session={s} />
          <Link
            href={`/learning/${s.weekNumber}`}
            className="inline-flex items-center justify-center gap-1 text-xs font-medium text-fellowship-navy hover:text-fellowship-navy-dark"
          >
            Open module
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
