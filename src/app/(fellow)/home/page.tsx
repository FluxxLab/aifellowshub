import type { Metadata } from "next";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import FellowHomeMetrics from "@/components/fellow/FellowHomeMetrics";
import FirstLoginTour from "@/components/fellow/FirstLoginTour";
import { ChevronRightIcon } from "@/icons";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getFellowHomeServer } from "@/lib/api/fellow-home.server";
import { formatCohortDate, formatCohortTime } from "@/lib/datetime";

export const metadata: Metadata = {
  title: "Home · AI Fellows LMS",
  description:
    "Your fellowship at a glance — current module, next session, and recent activity.",
};

// Force per-request rendering. The data is per-user (cohort, modules,
// attendance, AI quota) and changes mid-cohort whenever an admin
// publishes a module or a session marks attendance — we never want
// Next.js to reuse a previous render. Without this, fresh deploys
// can be briefly masked by a route-cache entry from the previous
// build, which is exactly the "subhead says 9, tile says 10"
// inconsistency we hit during the Onboarding rollout.
export const dynamic = "force-dynamic";

export default async function FellowHomePage() {
  const [user, home] = await Promise.all([
    getCurrentUser(),
    getFellowHomeServer(),
  ]);
  const firstName = user.fullName.split(" ")[0];
  const { cohort, metrics, currentModule, nextSession, recentActivity } = home;
  // Sessions are scheduled in Lagos time (UTC+1) — format with the
  // cohort timezone so the dashboard time matches what fellows
  // expect, regardless of where the server-side render runs.
  const sessionDate = nextSession
    ? formatCohortDate(nextSession.startsAt)
    : undefined;
  const sessionTime = nextSession
    ? formatCohortTime(nextSession.startsAt)
    : undefined;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {user.role === "fellow" && <FirstLoginTour firstName={firstName} />}
      <div data-tour="welcome">
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          Hi, {firstName}.
        </h1>
        <p className="mt-2 text-gray-600">
          {cohort.totalWeeks > 0 ? (
            <>You&apos;re in week {cohort.currentWeek} of {cohort.totalWeeks}</>
          ) : (
            <>Welcome to the {cohort.name}</>
          )}
          {currentModule && (
            <>
              {" "}·{" "}
              <Link
                href="/learning"
                className="font-semibold text-fellowship-navy underline-offset-2 hover:underline"
              >
                Continue {currentModule.title}
              </Link>
            </>
          )}
          {nextSession && sessionDate && sessionTime && (
            <>
              {" "}· Next live session{" "}
              <Link
                href="/my-sessions"
                className="font-semibold text-fellowship-navy underline-offset-2 hover:underline"
              >
                {sessionDate} at {sessionTime}
              </Link>
            </>
          )}
          .
        </p>
      </div>

      <FellowHomeMetrics metrics={metrics} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
        <section
          data-tour="continue-learning"
          className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
        >
          {currentModule ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Continue learning · Week {currentModule.weekNumber}
                  </span>
                  <h2 className="mt-1 text-xl font-semibold text-gray-800">
                    {currentModule.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Next up: {currentModule.nextLesson}
                  </p>
                </div>
                <Badge color="info" variant="light">
                  {currentModule.progressPercent}%
                </Badge>
              </div>

              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full bg-fellowship-navy"
                  style={{ width: `${currentModule.progressPercent}%` }}
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/learning">
                  <Button size="sm" variant="fellowship">
                    Resume module
                  </Button>
                </Link>
                <Link href="/learning">
                  <Button size="sm" variant="outline">
                    See full curriculum
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <h2 className="text-lg font-semibold text-gray-800">
                No modules unlocked yet
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                The curriculum will appear here once your cohort is active.
              </p>
            </div>
          )}
        </section>

        <section
          data-tour="next-session"
          className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
        >
          {nextSession ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Next live session
                </span>
                <Badge color="warning" variant="light">
                  Week {nextSession.weekNumber}
                </Badge>
              </div>
              <h2 className="mt-1 text-lg font-semibold text-gray-800">
                {nextSession.title}
              </h2>
              <dl className="mt-3 space-y-1.5 text-sm text-gray-600">
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">When</dt>
                  <dd className="text-gray-800">
                    {sessionDate} · {sessionTime}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Duration</dt>
                  <dd className="text-gray-800">{nextSession.durationMinutes} min</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Host</dt>
                  <dd className="text-gray-800">{nextSession.hostName}</dd>
                </div>
              </dl>
              <div className="mt-5">
                <Link href="/my-sessions" className="block">
                  <Button size="sm" variant="fellowship" className="w-full">
                    View my sessions
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Live sessions
              </span>
              <h2 className="mt-2 text-lg font-semibold text-gray-800">
                No sessions scheduled
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                You&apos;ll see your next session here as soon as one&apos;s on the calendar.
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Recent activity</h2>
          <Link
            href="/learning"
            className="inline-flex items-center gap-1 text-sm font-medium text-fellowship-navy hover:text-fellowship-navy-dark"
          >
            View progress
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            Nothing yet. Activity will appear here as you progress.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {recentActivity.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="text-gray-700">{entry.message}</span>
                <span className="text-xs text-gray-500">{entry.at}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
