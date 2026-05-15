import type { Metadata } from "next";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import {
  CheckCircleIcon,
  CheckLineIcon,
  CloseLineIcon,
  LockIcon,
  TimeIcon,
} from "@/icons";
import LearningTour from "@/components/fellow/tours/LearningTour";
import { getFellowCurriculumServer } from "@/lib/api/fellow-learning.server";
import type { FellowModuleSummary } from "@/lib/api/fellow-learning";

export const metadata: Metadata = {
  title: "Modules · AI Fellows LMS",
  description:
    "Your cohort curriculum. The next module unlocks when you attend the live session or pass the assessment (BRD §6.3).",
};

export default async function LearningPage() {
  const modules = await getFellowCurriculumServer();
  const completed = modules.filter((m) => m.status === "completed").length;
  const total = modules.length;
  // Guard against empty curricula — dividing by zero produces NaN
  // and the progress bar renders as "0 of 0 modules complete · NaN%".
  // For a fellow whose cohort has no published modules yet, show 0%
  // until faculty publish at least one.
  const overallPercent =
    total === 0
      ? 0
      : Math.round(
          modules.reduce((acc, m) => acc + m.progressPercent, 0) / total,
        );
  const currentModule = modules.find((m) => m.status === "in-progress");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <LearningTour />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Modules" },
        ]}
      />
      <div data-tour="learning-heading">
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">Curriculum</h1>
        <p className="mt-2 text-gray-600">
          Your modules across the Fellowship. The next module unlocks when you
          attend that week&apos;s live session{" "}
          <span className="font-semibold text-fellowship-navy">or</span> pass
          its assessment.
        </p>
      </div>

      <section
        data-tour="learning-progress"
        className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Your progress
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-800">
              {completed} of {total} modules complete · {overallPercent}%
            </h2>
            {currentModule && (
              <p className="mt-1 text-sm text-gray-600">
                Currently in Week {currentModule.weekNumber} ·{" "}
                {currentModule.title}
              </p>
            )}
          </div>
          <Badge color={completed === total ? "success" : "info"} variant="light">
            Cohort 2026
          </Badge>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full bg-fellowship-navy transition-[width] duration-300"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </section>

      {total === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center md:p-12">
          <p className="text-base font-semibold text-gray-700">
            No modules published yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Your cohort&apos;s modules will appear here as faculty publish
            them. Check back soon, or watch your inbox for the kick-off
            announcement.
          </p>
        </div>
      ) : (
        <ol
          data-tour="learning-modules"
          className="flex flex-col gap-3 md:gap-4"
        >
          {modules.map((m, i) => (
            <ModuleCard
              key={m.weekNumber}
              module={m}
              previous={i > 0 ? modules[i - 1] : null}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

type ModuleCardProps = {
  module: FellowModuleSummary;
  previous: FellowModuleSummary | null;
};

function ModuleCard({ module: m, previous }: ModuleCardProps) {
  const isLocked = m.status === "locked";
  const isCompleted = m.status === "completed";
  const isInProgress = m.status === "in-progress";

  const card = (
    <div
      className={`rounded-2xl border bg-white p-5 transition-colors md:p-6 ${
        isLocked
          ? "border-gray-200 opacity-75"
          : isInProgress
          ? "border-fellowship-navy/40 ring-1 ring-fellowship-navy/15"
          : "border-gray-200 hover:border-fellowship-navy/30"
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 items-start gap-4">
          <StatusOrb status={m.status} weekNumber={m.weekNumber} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Week {m.weekNumber}
              </span>
              <span className="text-gray-300">·</span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <TimeIcon className="h-3.5 w-3.5" />
                {Math.round((m.durationMinutes / 60) * 10) / 10}h
              </span>
              {isInProgress && (
                <Badge color="warning" variant="light">
                  In progress · {m.progressPercent}%
                </Badge>
              )}
              {isCompleted && (
                <Badge color="success" variant="light">
                  Completed
                </Badge>
              )}
              {isLocked && (
                <Badge color="light" variant="light">
                  Locked
                </Badge>
              )}
            </div>

            <h3
              className={`mt-1 text-lg font-semibold ${
                isLocked ? "text-gray-600" : "text-gray-800"
              }`}
            >
              {m.title}
            </h3>
            {/* Prefer the admin-authored Overview (first paragraph,
                line-clamped to two lines) over the legacy one-line
                summary. Falls back to summary when no overview is set,
                so older modules render unchanged. */}
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {previewFor(m)}
            </p>

            {isInProgress && (
              <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full bg-fellowship-navy"
                  style={{ width: `${m.progressPercent}%` }}
                />
              </div>
            )}

            {!isLocked && (
              <div className="mt-4 flex flex-wrap gap-2">
                <PathChip
                  label="Live session"
                  state={
                    m.sessionAttended === true
                      ? "good"
                      : m.sessionAttended === false
                      ? "bad"
                      : "pending"
                  }
                  detail={
                    m.sessionAttended === true
                      ? "Attended"
                      : m.sessionAttended === false
                      ? "Missed"
                      : "Upcoming"
                  }
                />
                {m.hasAssessment && (
                  <PathChip
                    label="Assessment"
                    state={
                      m.assessmentPassed === true
                        ? "good"
                        : m.assessmentPassed === false
                        ? "bad"
                        : "pending"
                    }
                    detail={
                      m.assessmentScore !== null
                        ? `${m.assessmentScore}%`
                        : m.assessmentPassed === false
                        ? "Failed"
                        : "Not yet"
                    }
                  />
                )}
              </div>
            )}

            {isLocked && previous && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-500">
                <LockIcon className="h-3.5 w-3.5" />
                Unlocks when Week {previous.weekNumber}&apos;s session is
                attended <span className="font-semibold">or</span> its
                assessment is passed.
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center md:pl-2">
          {isCompleted && (
            <Button size="sm" variant="outline">
              Re-read
            </Button>
          )}
          {isInProgress && (
            <Button size="sm" variant="fellowship">
              Resume
            </Button>
          )}
          {!isCompleted && !isInProgress && !isLocked && (
            <Button size="sm" variant="fellowship">
              Start
            </Button>
          )}
          {isLocked && (
            <Button size="sm" variant="outline" disabled>
              <LockIcon className="h-3.5 w-3.5" />
              Locked
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (isLocked) {
    return <li>{card}</li>;
  }

  return (
    <li>
      <Link href={`/learning/${m.weekNumber}`} className="block">
        {card}
      </Link>
    </li>
  );
}

/** Card-preview text for a module. Uses the admin-authored Overview's
 *  first paragraph when set, otherwise falls back to the one-line
 *  summary. CSS `line-clamp-2` on the rendering <p> caps the visual
 *  height so a long overview never blows out the card layout. */
function previewFor(m: FellowModuleSummary): string {
  const firstOverviewPara = m.overview
    ?.split(/\n{2,}/)[0]
    ?.trim();
  return firstOverviewPara || m.summary;
}

function StatusOrb({
  status,
  weekNumber,
}: {
  status: FellowModuleSummary["status"];
  weekNumber: number;
}) {
  if (status === "completed") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-600">
        <CheckCircleIcon className="h-5 w-5" />
      </div>
    );
  }
  if (status === "in-progress") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fellowship-navy text-white">
        <span className="text-sm font-semibold">{weekNumber}</span>
      </div>
    );
  }
  if (status === "locked") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <LockIcon className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-fellowship-navy/30 bg-white text-fellowship-navy">
      <span className="text-sm font-semibold">{weekNumber}</span>
    </div>
  );
}

function PathChip({
  label,
  state,
  detail,
}: {
  label: string;
  state: "good" | "bad" | "pending";
  detail: string;
}) {
  const styles =
    state === "good"
      ? "border-success-200 bg-success-50 text-success-700"
      : state === "bad"
      ? "border-gray-200 bg-gray-50 text-gray-500"
      : "border-warning-200 bg-warning-50 text-warning-700";

  const Icon =
    state === "good" ? CheckLineIcon : state === "bad" ? CloseLineIcon : TimeIcon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${styles}`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="text-gray-500">{label}:</span>
      <span>{detail}</span>
    </span>
  );
}
