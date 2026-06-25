import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import {
  CalenderIcon,
  CheckCircleIcon,
  CheckLineIcon,
  CloseLineIcon,
  LockIcon,
  TimeIcon,
} from "@/icons";
import { getFellowModuleServer } from "@/lib/api/fellow-learning.server";
import LessonsList from "@/components/fellow/LessonsList";
import ResourcesSection from "@/components/fellow/ResourcesSection";
import LiveSessionAction from "@/components/fellow/LiveSessionAction";
import SurveyGatedSessionAction from "@/components/fellow/SurveyGatedSessionAction";
import SessionFeedbackButton from "@/components/fellow/SessionFeedbackButton";
import ZoomSdkPrefetch from "@/components/fellow/ZoomSdkPrefetch";
import PreFellowshipSurvey from "@/components/fellow/PreFellowshipSurvey";
import type {
  FellowModuleDetail,
  ModuleSession,
  ModuleAssessment,
} from "@/lib/api/fellow-learning";

export async function generateMetadata({
  params,
}: {
  params: { week: string };
}): Promise<Metadata> {
  const { week } = params;
  const m = await getFellowModuleServer(Number(week));
  if (!m) return { title: "Module not found · AI Fellows LMS" };
  return {
    title: `Week ${m.weekNumber} · ${m.title} · AI Fellows LMS`,
    description: m.summary,
  };
}

export default async function ModuleDetailPage({
  params,
}: {
  params: { week: string };
}) {
  const { week } = params;
  const weekNumber = Number(week);
  if (!Number.isInteger(weekNumber)) notFound();

  const m = await getFellowModuleServer(weekNumber);
  if (!m) notFound();

  if (m.status === "locked") {
    return <LockedView module={m} />;
  }

  // Feedback is now collected per-session on the My Sessions page (one
  // response per attended session), so the module page no longer renders a
  // module-level survey.

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ZoomSdkPrefetch />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Modules", href: "/learning" },
          { label: `Week ${m.weekNumber} · ${m.title}` },
        ]}
      />

      <ModuleHeader module={m} />

      {weekNumber === 1 && <PreFellowshipSurvey />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
          <ModuleInfoSection module={m} />

          {/*
            Tiered assessments (BRD §6.5 + extension):
              1. Pre-quiz (faculty) — entry baseline, score hidden
              2. Lessons with optional inline mentor-authored quizzes
              3. Post-quiz (faculty) — exit measurement, score hidden
            Module unlocks the next week when all three are submitted +
            feedback. The fellow sees only "Submitted ✓" / "Not yet" for
            pre and post; lesson-level scores are visible.
          */}
          {m.preAssessment && (
            <AssessmentCard
              assessment={m.preAssessment}
              weekNumber={m.weekNumber}
              variant="pre"
            />
          )}
          <LessonsList lessons={m.lessons} sessionId={m.session.id} />
          {m.postAssessment && (
            <AssessmentCard
              assessment={m.postAssessment}
              weekNumber={m.weekNumber}
              variant="post"
            />
          )}
          <ResourcesSection resources={m.resources} />
          <SessionFeedbackSection sessions={m.feedbackSessions} />
        </div>
        <div className="flex flex-col gap-4 md:gap-6">
          <SessionCard
            session={m.session}
            weekNumber={m.weekNumber}
            moduleTitle={m.title}
            requiresSurvey={weekNumber === 1}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Per-session feedback on the module page. One prompt per session the fellow
 * attended (live / recording / excused). Renders nothing when there's no
 * attended session to give feedback on yet.
 */
function SessionFeedbackSection({
  sessions,
}: {
  sessions: FellowModuleDetail["feedbackSessions"];
}) {
  const attended = sessions.filter((s) => s.attended);
  if (attended.length === 0) return null;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <h2 className="text-base font-semibold text-gray-800">Session feedback</h2>
      <p className="mt-1 text-sm text-gray-600">
        Share your thoughts on each session you attended — it helps us improve
        the programme. Anonymous to faculty.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {attended.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800">
                {s.title}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(s.startsAt).toLocaleDateString(undefined, {
                  timeZone: "Africa/Lagos",
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
            <SessionFeedbackButton
              sessionId={s.id}
              sessionTitle={s.title}
              submitted={s.feedbackSubmitted}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function LockedView({ module: m }: { module: FellowModuleDetail }) {
  const previousWeek = m.weekNumber - 1;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Modules", href: "/learning" },
          { label: `Week ${m.weekNumber} · ${m.title}` },
        ]}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center md:p-12">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <LockIcon className="h-6 w-6" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Week {m.weekNumber}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-700">{m.title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
          This module unlocks when Week {previousWeek}&apos;s session is attended.
        </p>
        <div className="mt-6">
          <Link href={`/learning/${previousWeek}`}>
            <Button size="md" variant="fellowship">
              Go to Week {previousWeek}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ModuleHeader({ module: m }: { module: FellowModuleDetail }) {
  const isCompleted = m.status === "completed";
  const isInProgress = m.status === "in-progress";

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Week {m.weekNumber}
        </span>
        <span className="text-gray-300">·</span>
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
          <TimeIcon className="h-3.5 w-3.5" />
          {Math.round((m.durationMinutes / 60) * 10) / 10}h study
        </span>
        {isCompleted && (
          <Badge color="success" variant="light">
            Completed
          </Badge>
        )}
        {isInProgress && (
          <Badge color="warning" variant="light">
            In progress · {m.progressPercent}%
          </Badge>
        )}
      </div>

      <h1 className="mt-2 text-2xl font-bold text-gray-800 sm:text-3xl">
        {m.title}
      </h1>
      <p className="mt-2 max-w-3xl text-gray-600">{m.summary}</p>

      {isInProgress && (
        <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full bg-fellowship-navy"
            style={{ width: `${m.progressPercent}%` }}
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <PathChip
          label="Live session"
          state={
            m.sessionAttended === true
              ? "good"
              : m.sessionAttended === false || m.sessionEnded
              ? "bad"
              : "pending"
          }
          detail={
            m.sessionAttended === true
              ? "Attended"
              : m.sessionAttended === false
              ? "Missed"
              : m.sessionEnded
              ? "Catch up"
              : "Upcoming"
          }
        />
        {/* Only show the Assessment chip when the module actually has
            one. Faculty-light weeks without a pre/post quiz or
            lesson-level quiz hide it so fellows don't see a
            permanently-pending control with nothing to act on. */}
        {hasAnyAssessment(m) && (
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
    </section>
  );
}

/** True when the module has at least one assessment the fellow can
 *  take — pre-quiz, post-quiz, or a lesson-level quiz. Drives whether
 *  the Assessment chip and the AssessmentCards render. */
function hasAnyAssessment(m: FellowModuleDetail): boolean {
  if (m.preAssessment) return true;
  if (m.postAssessment) return true;
  return m.lessons.some((l) => Boolean(l.assessment));
}

/** Long-form module info: Overview, Learning objectives, Keywords.
 *  All three fields are optional; the section only renders when at
 *  least one is set so modules without prose info don't show an
 *  empty card. */
function ModuleInfoSection({ module: m }: { module: FellowModuleDetail }) {
  const hasOverview = Boolean(m.overview && m.overview.trim().length > 0);
  const objectives = (m.learningObjectives ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const hasObjectives = objectives.length > 0;
  const hasKeywords = (m.keywords ?? []).length > 0;

  if (!hasOverview && !hasObjectives && !hasKeywords) return null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      {hasOverview && (
        <div>
          <h2 className="text-base font-semibold text-gray-800">Overview</h2>
          {/* Render newlines as paragraph breaks. Faculty type prose
              with paragraph spacing, not Markdown — keep it simple. */}
          <div className="mt-2 space-y-3 text-sm leading-relaxed text-gray-700">
            {m.overview!.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      )}

      {hasObjectives && (
        <div className={hasOverview ? "mt-6" : ""}>
          <h2 className="text-base font-semibold text-gray-800">
            Learning objectives
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {objectives.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      )}

      {hasKeywords && (
        <div className={hasOverview || hasObjectives ? "mt-6" : ""}>
          <h2 className="text-base font-semibold text-gray-800">Keywords</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {m.keywords.map((k) => (
              <span
                key={k}
                className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
              >
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SessionCard({
  session: s,
  weekNumber,
  moduleTitle,
  requiresSurvey,
}: {
  session: ModuleSession;
  weekNumber: number;
  moduleTitle: string;
  requiresSurvey?: boolean;
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

  // "Closed" + hidden Register + auto-Attended is the treatment for
  // the Onboarding module specifically — orientation was run outside
  // the LMS before the cohort started, so there's nothing to action.
  // Title-matched (case-insensitive "onboarding") rather than gated
  // purely on Week 0, so a future cohort that chooses to run an
  // in-LMS Week 0 (e.g. an intro live session) keeps the normal
  // Register / attendance flow.
  const isOnboarding =
    weekNumber <= 0 && /onboarding/i.test(moduleTitle);
  const isEnded = s.status === "ended";
  const effectiveAttended = isOnboarding ? true : s.attended;

  return (
    <section className="rounded-2xl border border-warning-200 bg-warning-100 p-5 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-200">
          <CalenderIcon className="h-5 w-5 text-fellowship-navy" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-gray-800">
            {s.title || "Live session"}
          </h2>
          <p className="text-xs text-gray-500">
            Week {weekNumber} · {isOnboarding ? "orientation" : "live-only"}
          </p>
        </div>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        {/* When + Host read "Closed" for orientation — the placeholder
            session date / TBD host are irrelevant because the meeting
            happened outside the LMS before the cohort started. Duration
            stays so the row reads like a real archived record. */}
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500">When</dt>
          <dd className="text-gray-800">
            {isOnboarding ? "Closed" : `${dateLabel} · ${timeLabel}`}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500">Duration</dt>
          <dd className="text-gray-800">{s.durationMinutes} min</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500">Host</dt>
          <dd className="text-gray-800">
            {isOnboarding ? "Closed" : s.hostName}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500">Status</dt>
          <dd>
            {isOnboarding ? (
              <Badge color="success">Attended</Badge>
            ) : (
              <SessionStatusBadge
                status={s.status}
                attended={effectiveAttended}
              />
            )}
          </dd>
        </div>
      </dl>

      {/* Orientation skips Register / Join entirely — the session
          happened outside the LMS, so there's nothing to action. */}
      {!isOnboarding && (
        <div className="mt-5">
          <SessionAction session={s} requiresSurvey={requiresSurvey} />
          {(s.status === "live" || s.status === "upcoming") && (
            <p className="mt-2 text-center text-xs text-gray-500">
              Hosted on Zoom · attendance auto-credited
            </p>
          )}
        </div>
      )}

      {!isOnboarding && isEnded && s.attended === false && (
        <p className="mt-3 rounded-md bg-gray-50 p-3 text-xs text-gray-600">
          You missed this session. Watch the lesson videos above — your
          progress is tracked automatically and counts toward module
          completion.
        </p>
      )}
    </section>
  );
}

function SessionStatusBadge({
  status,
  attended,
}: {
  status: ModuleSession["status"];
  attended: boolean | null;
}) {
  if (status === "live") return <Badge color="error">Live now</Badge>;
  if (status === "upcoming") return <Badge color="info">Upcoming</Badge>;
  if (status === "cancelled") return <Badge color="light">Cancelled</Badge>;
  return attended ? (
    <Badge color="success">Attended</Badge>
  ) : (
    <Badge color="light">Missed</Badge>
  );
}

function SessionAction({
  session: s,
  requiresSurvey,
}: {
  session: ModuleSession;
  requiresSurvey?: boolean;
}) {
  if (requiresSurvey) return <SurveyGatedSessionAction session={s} />;
  return <LiveSessionAction session={s} />;
}

/**
 * Renders one tier of a module's assessment. `variant` drives the heading
 * label and tone:
 *   - "pre"    → "Pre-assessment" (entry baseline, score hidden)
 *   - "post"   → "Post-assessment" (exit measurement, score hidden)
 *   - "lesson" → currently unused at the module level (lessons render their
 *                own embedded quiz), kept for future flexibility
 *   - omitted  → legacy "module assessment" copy
 *
 * When `a.hideScore` is true, we suppress the pass mark, best score, and
 * pass/fail badge — the fellow only sees "Submitted ✓" or "Not yet". This
 * preserves the diagnostic intent (BRD §6.5 extension) so fellows can't
 * game the post-quiz to look like they learned more.
 */
function AssessmentCard({
  assessment: a,
  weekNumber,
  variant,
}: {
  assessment: ModuleAssessment;
  weekNumber: number;
  variant?: "pre" | "post" | "lesson";
}) {
  const passed = a.status === "passed";
  const failed = a.status === "failed";
  const submitted = a.status === "submitted" || a.attemptsUsed > 0;
  const attemptsLeft = a.attemptsAllowed - a.attemptsUsed;
  const heading =
    variant === "pre"
      ? "Pre-assessment"
      : variant === "post"
      ? "Post-assessment"
      : "Assessment";
  const subhead =
    variant === "pre"
      ? `Entry quiz · Week ${weekNumber}`
      : variant === "post"
      ? `Exit quiz · Week ${weekNumber}`
      : `Week ${weekNumber}`;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning-100">
          <CheckCircleIcon className="h-5 w-5 text-fellowship-navy" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-800">{heading}</h2>
          <p className="text-xs text-gray-500">{subhead}</p>
        </div>
      </div>

      {a.hideScore && (
        <p className="mt-3 rounded-md bg-gray-50 p-3 text-xs text-gray-600">
          Diagnostic only. Your responses are recorded so faculty and
          mentors can measure cohort progress, but you won&apos;t see your
          score on this one.
        </p>
      )}

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500">Time limit</dt>
          <dd className="text-gray-800">{a.timeLimitMinutes} min</dd>
        </div>
        {!a.hideScore && (
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Pass mark</dt>
            <dd className="text-gray-800">{a.passingScore}%</dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt className="text-gray-500">Attempts</dt>
          <dd className="text-gray-800">
            {a.attemptsUsed} / {a.attemptsAllowed} used
          </dd>
        </div>
        {!a.hideScore && a.bestScore !== null && (
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Your best</dt>
            <dd
              className={`font-semibold ${
                passed ? "text-success-600" : "text-error-600"
              }`}
            >
              {a.bestScore}% · {passed ? "Passed" : "Failed"}
            </dd>
          </div>
        )}
        {a.hideScore && (
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Status</dt>
            <dd
              className={`font-semibold ${
                submitted ? "text-success-600" : "text-gray-700"
              }`}
            >
              {submitted ? "Submitted ✓" : "Not yet"}
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-5">
        {a.hideScore && submitted ? (
          <Button size="sm" variant="outline" className="w-full" disabled>
            Already submitted
          </Button>
        ) : passed ? (
          <Link href={`/learning/take/${encodeURIComponent(a.moduleId)}`} className="block">
            <Button size="sm" variant="outline" className="w-full">
              Review your attempt
            </Button>
          </Link>
        ) : a.status === "in-progress" ? (
          <Link href={`/learning/take/${encodeURIComponent(a.moduleId)}`} className="block">
            <Button size="sm" variant="fellowship" className="w-full">
              Resume attempt
            </Button>
          </Link>
        ) : failed && attemptsLeft > 0 ? (
          <Link href={`/learning/take/${encodeURIComponent(a.moduleId)}`} className="block">
            <Button size="sm" variant="fellowship" className="w-full">
              Retake ({attemptsLeft} left)
            </Button>
          </Link>
        ) : a.status === "not-started" ? (
          <Link href={`/learning/take/${encodeURIComponent(a.moduleId)}`} className="block">
            <Button size="sm" variant="fellowship" className="w-full">
              {variant === "pre"
                ? "Start pre-assessment"
                : variant === "post"
                ? "Start post-assessment"
                : "Start assessment"}
            </Button>
          </Link>
        ) : (
          <Button size="sm" variant="outline" className="w-full" disabled>
            No attempts left
          </Button>
        )}
      </div>
    </section>
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
