import type { Metadata } from "next";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import LiveSessionAction from "@/components/fellow/LiveSessionAction";
import PastSessionsTable from "@/components/fellow/PastSessionsTable";
import SessionsTour from "@/components/fellow/tours/SessionsTour";
import { CalenderIcon, ChevronRightIcon, TimeIcon } from "@/icons";
import { getFellowSessionsServer } from "@/lib/api/fellow-learning.server";
import type { FellowSession } from "@/lib/api/fellow-learning";

export const metadata: Metadata = {
  title: "My sessions · AI Fellows LMS",
  description:
    "All 12 live sessions in your cohort. Sessions run on Zoom — attendance is auto-credited if you stay for at least 50% of the duration (BRD §6.4).",
};

export default async function FellowSessionsPage() {
  const sessions = await getFellowSessionsServer();

  const live = sessions.filter((s) => s.status === "live");
  const upcoming = sessions
    .filter((s) => s.status === "upcoming")
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const past = sessions
    .filter((s) => s.status === "ended")
    .sort((a, b) => +new Date(b.startsAt) - +new Date(a.startsAt));

  const attendedCount = past.filter((s) => s.attended === true).length;
  const attendanceRate =
    past.length > 0 ? Math.round((attendedCount / past.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <SessionsTour />
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
          12 live sessions, one per module — hosted on Zoom. Attendance is
          auto-credited when you stay in the meeting for at least 50% of the
          duration.
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
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeLabel = start.toLocaleTimeString(undefined, {
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
                {s.durationMinutes} min · {s.attendanceThresholdMinutes}{" "}
                min for credit
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
