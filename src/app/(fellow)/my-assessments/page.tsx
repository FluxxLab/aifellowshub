import type { Metadata } from "next";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  CloseLineIcon,
  LockIcon,
  TimeIcon,
} from "@/icons";
import { getFellowCurriculumDetailServer } from "@/lib/api/fellow-learning.server";
import type {
  AssessmentKind,
  FellowModuleDetail,
  ModuleAssessment,
} from "@/lib/api/fellow-learning";

export const metadata: Metadata = {
  title: "Assessments · AI Fellows LMS",
  description:
    "All your pre-, lesson-, and post-assessments in one place. Submit each one to keep moving through the cohort.",
};

/**
 * Flattened assessment row used by the list. Carries enough module + lesson
 * context for the fellow to navigate back to the source module page.
 */
type Row = {
  assessment: ModuleAssessment;
  weekNumber: number;
  moduleId: string | null;
  moduleTitle: string;
  lessonTitle: string | null;
  moduleUnlocked: boolean;
};

const KIND_COPY: Record<AssessmentKind, { label: string; tone: "info" | "warning" | "primary" }> =
  {
    pre: { label: "Pre-assessment", tone: "info" },
    lesson: { label: "Lesson quiz", tone: "primary" },
    post: { label: "Post-assessment", tone: "warning" },
  };

export default async function FellowAssessmentsPage() {
  const modules = await getFellowCurriculumDetailServer();
  const rows = flatten(modules);

  // Group by status bucket for a useful overview. The cohort cares about
  // what's outstanding more than what's already done.
  const todo = rows.filter((r) => isTodo(r.assessment));
  const submitted = rows.filter((r) => isSubmitted(r.assessment));
  const passed = rows.filter((r) => r.assessment.status === "passed");
  const failed = rows.filter((r) => r.assessment.status === "failed");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/home" }, { label: "Assessments" }]} />
      <div>
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          Assessments
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Every quiz across your cohort — pre, lesson, and post. Pre and
          post are diagnostic (no score shown); lesson quizzes are
          graded. Submit them all to unlock the next module.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="To do" value={todo.length} tone="warning" />
        <Tile label="Submitted" value={submitted.length} tone="info" />
        <Tile label="Passed" value={passed.length} tone="success" />
        <Tile label="Failed" value={failed.length} tone="error" />
      </div>

      {todo.length > 0 && <Section title="To do" rows={todo} />}
      {submitted.length > 0 && <Section title="Submitted (awaiting review)" rows={submitted} />}
      {passed.length > 0 && <Section title="Passed" rows={passed} />}
      {failed.length > 0 && <Section title="Failed — retake available" rows={failed} />}

      {rows.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            No assessments published yet. Faculty + your mentor add them as
            modules go live.
          </p>
        </div>
      )}
    </div>
  );
}

function flatten(modules: FellowModuleDetail[]): Row[] {
  const out: Row[] = [];
  for (const m of modules) {
    if (m.preAssessment) {
      out.push({
        assessment: m.preAssessment,
        weekNumber: m.weekNumber,
        moduleId: m.id,
        moduleTitle: m.title,
        lessonTitle: null,
        moduleUnlocked: m.status !== "locked",
      });
    }
    for (const l of m.lessons) {
      if (l.assessment) {
        out.push({
          assessment: l.assessment,
          weekNumber: m.weekNumber,
          moduleId: m.id,
          moduleTitle: m.title,
          lessonTitle: l.title,
          moduleUnlocked: m.status !== "locked",
        });
      }
    }
    if (m.postAssessment) {
      out.push({
        assessment: m.postAssessment,
        weekNumber: m.weekNumber,
        moduleId: m.id,
        moduleTitle: m.title,
        lessonTitle: null,
        moduleUnlocked: m.status !== "locked",
      });
    }
  }
  return out;
}

function isTodo(a: ModuleAssessment) {
  // Pre/post → "to do" until at least one attempt exists. Lesson →
  // "to do" while not started AND not yet passed.
  if (a.hideScore) return a.attemptsUsed === 0;
  return a.status === "not-started";
}

function isSubmitted(a: ModuleAssessment) {
  if (a.hideScore) return a.attemptsUsed > 0;
  return a.status === "submitted";
}

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "warning" | "info" | "success" | "error";
}) {
  const toneClass: Record<typeof tone, string> = {
    warning: "border-warning-200 bg-warning-50",
    info: "border-blue-200 bg-blue-50",
    success: "border-success-200 bg-success-50",
    error: "border-error-200 bg-error-50",
  };
  return (
    <div className={`rounded-2xl border p-4 ${toneClass[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <ul className="mt-4 divide-y divide-gray-100">
        {rows.map((r) => (
          <li key={r.assessment.id}>
            <RowItem row={r} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RowItem({ row: r }: { row: Row }) {
  const a = r.assessment;
  const meta = KIND_COPY[a.kind];
  const passed = a.status === "passed";
  const failed = a.status === "failed";
  const submitted = a.attemptsUsed > 0;
  const unlocked = r.moduleUnlocked;

  // Module-level take URL. Tiered per-kind take routes will replace this
  // once the backend exposes /assessments/:id/take; for now the legacy
  // /learning/take/:moduleId picks the canonical assessment.
  const takeHref =
    r.moduleId !== null
      ? `/learning/take/${encodeURIComponent(r.moduleId)}`
      : "#";

  return (
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color={meta.tone === "primary" ? "primary" : meta.tone} variant="light">
            {meta.label}
          </Badge>
          <span className="text-xs uppercase tracking-wide text-gray-500">
            Week {r.weekNumber}
          </span>
          {!unlocked && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <LockIcon className="h-3.5 w-3.5" />
              Module locked
            </span>
          )}
        </div>
        <p className="mt-1 text-sm font-semibold text-gray-800">
          {a.title}
        </p>
        <p className="text-xs text-gray-500">
          {r.moduleTitle}
          {r.lessonTitle ? ` · ${r.lessonTitle}` : ""}
        </p>
        <p className="mt-1 inline-flex items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <TimeIcon className="h-3.5 w-3.5" />
            {a.timeLimitMinutes} min
          </span>
          {!a.hideScore && (
            <span>Pass mark · {a.passingScore}%</span>
          )}
          <span>
            {a.attemptsUsed} / {a.attemptsAllowed} used
          </span>
          {!a.hideScore && a.bestScore !== null && (
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                passed ? "text-success-600" : "text-error-600"
              }`}
            >
              {passed ? (
                <CheckCircleIcon className="h-3.5 w-3.5" />
              ) : (
                <CloseLineIcon className="h-3.5 w-3.5" />
              )}
              {a.bestScore}%
            </span>
          )}
        </p>
      </div>
      <div>
        {!unlocked ? (
          <Link
            href={`/learning/${r.weekNumber}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700"
          >
            View module
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        ) : a.hideScore && submitted ? (
          <span className="text-xs font-semibold text-success-600">
            Submitted ✓
          </span>
        ) : (
          <Link
            href={takeHref}
            className="inline-flex items-center gap-1 text-xs font-semibold text-fellowship-navy hover:text-fellowship-navy-dark"
          >
            {passed
              ? "Review"
              : failed
              ? "Retake"
              : a.status === "in-progress"
              ? "Resume"
              : "Start"}
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
