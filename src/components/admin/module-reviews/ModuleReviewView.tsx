"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import {
  CheckLineIcon,
  CloseLineIcon,
  DocsIcon,
  FileIcon,
  TimeIcon,
  VideoIcon,
} from "@/icons";
import {
  approveModule,
  returnModule,
  type FacultyLesson,
  type FacultyReviewItem,
  type FacultyResource,
} from "@/lib/api/faculty";
import { toast } from "@/lib/toast";

type Decision = "pending" | "approved" | "returned";

/**
 * Admin's review surface for a faculty submission (BRD §6.3, §6.5).
 * Approve publishes the module; return bounces it to draft with a note.
 */
export default function ModuleReviewView({
  item,
}: {
  item: FacultyReviewItem;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision>("pending");
  const [returnNote, setReturnNote] = useState("");
  const [savingState, setSavingState] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  const onApprove = async () => {
    setError(null);
    setSavingState("saving");
    try {
      await approveModule(item.moduleId);
      setDecision("approved");
      toast.success("Module published", `${item.moduleTitle} is live.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish.");
      toast.errorFromException("Couldn't publish module", err);
    }
    setSavingState("idle");
  };

  const onReturn = async () => {
    if (returnNote.trim().length < 10) return;
    setError(null);
    setSavingState("saving");
    try {
      await returnModule(item.moduleId, returnNote.trim());
      setDecision("returned");
      toast.success(
        "Returned for revision",
        "Faculty has been notified with your note.",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not return.");
      toast.errorFromException("Couldn't return module", err);
    }
    setSavingState("idle");
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Programme", href: "/module-reviews" },
          { label: "Module reviews", href: "/module-reviews" },
          { label: item.moduleTitle },
        ]}
      />

      <SubmissionHeader item={item} decision={decision} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
          <ContentCard title={item.detail.title} summary={item.detail.summary} />
          <LessonsCard lessons={item.detail.lessons} />
          <ResourcesCard resources={item.detail.resources} />
        </div>

        <aside className="flex flex-col gap-4 md:gap-6">
          <DecisionCard
            decision={decision}
            savingState={savingState}
            returnNote={returnNote}
            setReturnNote={setReturnNote}
            onApprove={onApprove}
            onReturn={onReturn}
            error={error}
          />
          <AssessmentCard assessment={item.detail.assessment} />
        </aside>
      </div>
    </div>
  );
}

function SubmissionHeader({
  item,
  decision,
}: {
  item: FacultyReviewItem;
  decision: Decision;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <AvatarText name={item.submittedBy.name} className="h-12 w-12 text-base" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Week {item.weekNumber}
              </span>
              {item.kind === "new" ? (
                <Badge color="success" variant="light">
                  New module
                </Badge>
              ) : (
                <Badge color="info" variant="light">
                  Revision
                </Badge>
              )}
              <DecisionBadge decision={decision} />
            </div>
            <h1 className="mt-1 text-2xl font-bold text-gray-800">
              {item.moduleTitle}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Submitted by{" "}
              <span className="font-semibold text-gray-700">
                {item.submittedBy.name}
              </span>{" "}
              · {relativeTime(item.submittedAt)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function DecisionBadge({ decision }: { decision: Decision }) {
  if (decision === "approved") {
    return <Badge color="success">Approved ✓</Badge>;
  }
  if (decision === "returned") {
    return <Badge color="error">Returned</Badge>;
  }
  return (
    <Badge color="warning" variant="light">
      Awaiting review
    </Badge>
  );
}

function ContentCard({
  title,
  summary,
}: {
  title: string;
  summary: string;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <h2 className="text-base font-semibold text-gray-800">Module content</h2>
      <h3 className="mt-3 text-lg font-semibold text-gray-800">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-700">{summary}</p>
    </section>
  );
}

function LessonsCard({ lessons }: { lessons: FacultyLesson[] }) {
  const totalMinutes = lessons.reduce((acc, l) => acc + l.durationMinutes, 0);
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">
          Lessons ({lessons.length})
        </h2>
        <span className="text-xs text-gray-500">{totalMinutes} min total</span>
      </div>
      <ol className="mt-4 divide-y divide-gray-100">
        {lessons.map((l) => (
          <li
            key={l.id}
            className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 text-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  {l.kind}
                </span>
                <span className="text-gray-300">·</span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <TimeIcon className="h-3.5 w-3.5" />
                  {l.durationMinutes} min
                </span>
              </div>
              <p className="mt-1 font-semibold text-gray-800">{l.title}</p>
              {l.summary && (
                <p className="mt-1 text-sm text-gray-600">{l.summary}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ResourcesCard({ resources }: { resources: FacultyResource[] }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <h2 className="text-base font-semibold text-gray-800">
        Resources ({resources.length})
      </h2>
      {resources.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">None attached.</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100">
          {resources.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="flex items-center gap-3">
                <ResourceIcon kind={r.kind} />
                <span className="text-sm text-gray-800">{r.title}</span>
              </div>
              <span className="text-xs uppercase tracking-wide text-gray-500">
                {r.kind}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AssessmentCard({
  assessment,
}: {
  assessment: FacultyReviewItem["detail"]["assessment"];
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <h2 className="text-base font-semibold text-gray-800">Assessment</h2>
      <h3 className="mt-3 text-sm font-semibold text-gray-800">
        {assessment.title}
      </h3>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Questions</dt>
          <dd className="text-gray-800">{assessment.questionCount}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Pass mark</dt>
          <dd className="text-gray-800">{assessment.passingScore}%</dd>
        </div>
      </dl>
    </section>
  );
}

function DecisionCard({
  decision,
  savingState,
  returnNote,
  setReturnNote,
  onApprove,
  onReturn,
  error,
}: {
  decision: Decision;
  savingState: "idle" | "saving";
  returnNote: string;
  setReturnNote: (v: string) => void;
  onApprove: () => void;
  onReturn: () => void;
  error: string | null;
}) {
  if (decision === "approved") {
    return (
      <section className="rounded-2xl border border-success-200 bg-success-50 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-500 text-white">
            <CheckLineIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-gray-800">Approved</p>
            <p className="mt-1 text-sm text-gray-600">
              The module is now published. Faculty has been notified, and
              fellows will see the new version on their next visit.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (decision === "returned") {
    return (
      <section className="rounded-2xl border border-error-200 bg-error-50 p-5 md:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-error-500 text-white">
            <CloseLineIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-gray-800">Returned for revision</p>
            <p className="mt-1 text-sm text-gray-600">
              Your note has been sent to the faculty. The module is back in
              their drafts.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const canReturn = returnNote.trim().length >= 10;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Decision
      </p>
      <p className="mt-1 text-sm text-gray-600">
        Approving publishes the module. Returning sends it back to the faculty
        with your note as the reason.
      </p>
      {error && (
        <p className="mt-3 rounded-md bg-error-50 p-2 text-xs font-medium text-error-700">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <Button
          size="sm"
          variant="fellowship"
          onClick={onApprove}
          disabled={savingState === "saving"}
          className="w-full"
        >
          <CheckLineIcon className="h-4 w-4" />
          Approve & publish
        </Button>
      </div>

      <div className="mt-5 border-t border-gray-100 pt-4">
        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Return note
        </label>
        <textarea
          rows={4}
          value={returnNote}
          onChange={(e) => setReturnNote(e.target.value)}
          placeholder="What needs changing before this can be published?"
          className="mt-2 w-full resize-y rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
        />
        <p className="mt-1 text-xs text-gray-400">
          Min 10 characters — the faculty sees this as the reason for return.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={onReturn}
          disabled={!canReturn || savingState === "saving"}
          className="mt-3 w-full"
        >
          <CloseLineIcon className="h-4 w-4" />
          Return for revision
        </Button>
      </div>
    </section>
  );
}

function ResourceIcon({ kind }: { kind: FacultyResource["kind"] }) {
  if (kind === "pdf") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-error-50 text-error-500">
        <FileIcon className="h-4 w-4" />
      </span>
    );
  }
  if (kind === "video") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-warning-50 text-warning-600">
        <VideoIcon className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-info-50 text-info-500">
      <DocsIcon className="h-4 w-4" />
    </span>
  );
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return `${Math.round(days / 7)} weeks ago`;
}
