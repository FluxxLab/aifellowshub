"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { toast } from "@/lib/toast";
import { CheckCircleIcon, FileIcon } from "@/icons";
import {
  gradeAttempt,
  type GradeOnePayload,
  type GraderAttempt,
  type GraderAttemptAnswer,
} from "@/lib/api/grading";

type GradeDraft = {
  /**
   * 0, 0.5, or 1 once the grader picks. Null = no decision yet (initial state
   * for ungraded manual answers). Save is disabled until every manual answer
   * has a non-null score.
   */
  score: number | null;
  feedback: string;
  /** Has the grader touched this answer since the page loaded? */
  dirty: boolean;
};

/**
 * Faculty grading form for a single attempt (BRD §6.5).
 *
 * Multiple-choice answers display as auto-graded (read-only). Manual answers
 * — short_text, essay, attachment — render an editable score + feedback
 * panel. Submitting POSTs the changed grades; the backend recomputes the
 * attempt's final percentage and pass/fail when every answer has a score.
 */
/**
 * Reusable grading surface — used by both faculty (`/faculty/grading`)
 * and mentor (`/mentor/grading`). Pass `returnTo` to control where the
 * form redirects after a successful save; defaults to the faculty
 * queue for backwards compatibility.
 */
export default function GradingForm({
  attempt,
  returnTo = "/faculty/grading",
}: {
  attempt: GraderAttempt;
  returnTo?: string;
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [drafts, setDrafts] = useState<Record<string, GradeDraft>>(() => {
    const init: Record<string, GradeDraft> = {};
    for (const a of attempt.answers) {
      if (a.question.kind === "multiple_choice") continue;
      init[a.id] = {
        score: a.score, // null preserves "not decided yet"
        feedback: a.feedback ?? "",
        dirty: false,
      };
    }
    return init;
  });
  const [submitting, setSubmitting] = useState(false);

  const manualAnswers = useMemo(
    () =>
      attempt.answers.filter((a) => a.question.kind !== "multiple_choice"),
    [attempt.answers],
  );

  const dirtyCount = Object.values(drafts).filter((d) => d.dirty).length;
  const allManualScored = manualAnswers.every(
    (a) => drafts[a.id]?.score !== null && drafts[a.id]?.score !== undefined,
  );
  const allGraded = attempt.answers.every((a) => a.score !== null);

  const setDraft = (answerId: string, patch: Partial<GradeDraft>) =>
    setDrafts((prev) => ({
      ...prev,
      [answerId]: { ...prev[answerId], ...patch, dirty: true },
    }));

  async function handleSubmit() {
    if (submitting) return;
    if (dirtyCount === 0) {
      toast.error(
        "Nothing to save",
        "Adjust at least one score or feedback note before saving.",
      );
      return;
    }
    const ok = await confirm({
      title: `Save ${dirtyCount} grade${dirtyCount === 1 ? "" : "s"}?`,
      message:
        "The fellow will see their score and feedback once every answer is graded.",
      confirmLabel: "Save grades",
    });
    if (!ok) return;

    const payload: GradeOnePayload[] = Object.entries(drafts)
      .filter(([, d]) => d.dirty && d.score !== null)
      .map(([answerId, d]) => ({
        answerId,
        score: d.score as number,
        feedback: d.feedback.trim() || undefined,
      }));

    setSubmitting(true);
    try {
      await gradeAttempt(attempt.id, payload);
      toast.success(
        "Grades saved",
        "The attempt has been updated.",
      );
      router.push(returnTo);
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't save grades", err);
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={attempt.status} />
              <span className="text-xs text-gray-500">
                Submitted {new Date(attempt.submittedAt).toLocaleString()}
              </span>
            </div>
            <h1 className="mt-1 text-title-sm font-bold text-gray-800">
              {attempt.assessment?.title ?? "Assessment"}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {attempt.fellow?.fullName ?? "Unknown fellow"}
              {attempt.fellow?.email && (
                <span className="text-gray-400"> · {attempt.fellow.email}</span>
              )}
              {attempt.assessment?.module && (
                <span>
                  {" · "}Week {attempt.assessment.module.weekNumber} of{" "}
                  {attempt.assessment.module.course?.title ?? "—"}
                </span>
              )}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 px-4 py-2 text-right">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Final score
            </p>
            <p className="text-lg font-bold text-fellowship-navy">
              {attempt.score !== null ? `${attempt.score}%` : "—"}
            </p>
            <p className="text-xs text-gray-500">
              Pass mark {attempt.assessment?.passingScore ?? 70}%
            </p>
          </div>
        </div>
      </header>

      <ol className="flex flex-col gap-4">
        {attempt.answers.map((answer, idx) => (
          <AnswerCard
            key={answer.id}
            answer={answer}
            index={idx}
            draft={drafts[answer.id]}
            onScoreChange={(score) => setDraft(answer.id, { score })}
            onFeedbackChange={(feedback) => setDraft(answer.id, { feedback })}
            disabled={submitting || allGraded}
          />
        ))}
      </ol>

      <footer className="sticky bottom-2 flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-md md:p-5">
        <p className="text-sm text-gray-600">
          {!allManualScored
            ? "Pick a score for every manual answer to save."
            : dirtyCount > 0
            ? `${dirtyCount} unsaved change${dirtyCount === 1 ? "" : "s"}`
            : allGraded
            ? "Fully graded"
            : "No changes yet"}
        </p>
        <Button
          size="md"
          variant="fellowship"
          onClick={handleSubmit}
          disabled={submitting || !allManualScored || dirtyCount === 0}
        >
          {submitting ? "Saving…" : "Save grades"}
        </Button>
      </footer>

      {dialog}
    </>
  );
}

function AnswerCard({
  answer,
  index,
  draft,
  onScoreChange,
  onFeedbackChange,
  disabled,
}: {
  answer: GraderAttemptAnswer;
  index: number;
  draft: GradeDraft | undefined;
  onScoreChange: (score: number) => void;
  onFeedbackChange: (feedback: string) => void;
  disabled: boolean;
}) {
  const isManual = answer.question.kind !== "multiple_choice";
  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Question {index + 1}
          </span>
          <span className="ml-2 text-xs text-gray-400">
            {kindLabel(answer.question.kind)}
          </span>
        </div>
        {!isManual && (
          <Badge
            color={answer.score === 1 ? "success" : "error"}
            variant="light"
          >
            Auto · {answer.score === 1 ? "Correct" : "Incorrect"}
          </Badge>
        )}
      </div>
      <p className="mt-2 text-sm font-medium text-gray-800 whitespace-pre-wrap">
        {answer.question.prompt}
      </p>

      <div className="mt-4">
        {answer.question.kind === "multiple_choice" && (
          <ul className="flex flex-col gap-2">
            {answer.question.choices.map((c) => {
              const picked = answer.choiceId === c.id;
              return (
                <li
                  key={c.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    c.isCorrect
                      ? "border-success-200 bg-success-50"
                      : picked
                      ? "border-error-200 bg-error-50"
                      : "border-gray-200"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      picked
                        ? "border-fellowship-navy bg-fellowship-navy text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {picked && <CheckCircleIcon className="h-3 w-3" />}
                  </span>
                  <span className="flex-1 text-sm text-gray-800">
                    {c.text}
                  </span>
                  {c.isCorrect && (
                    <Badge color="success" variant="light">
                      Answer key
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {(answer.question.kind === "short_text" ||
          answer.question.kind === "essay") && (
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap">
            {answer.text || (
              <span className="italic text-gray-400">No answer submitted.</span>
            )}
          </div>
        )}

        {answer.question.kind === "attachment" && (
          <div className="rounded-lg bg-gray-50 p-4 text-sm">
            {answer.fileUrl ? (
              <>
                <div className="flex items-center gap-3">
                  <FileIcon className="h-5 w-5 shrink-0 text-gray-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-800">
                      {answer.fileName ?? "Uploaded file"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatAnswerMime(answer.fileMimeType)}
                      {answer.fileBytes
                        ? ` · ${formatAnswerBytes(answer.fileBytes)}`
                        : ""}
                    </p>
                  </div>
                  <a
                    href={answer.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-fellowship-navy hover:bg-gray-50"
                  >
                    Open
                  </a>
                </div>
                {/* Inline preview for the formats the browser can render
                    cleanly — saves the grader from a separate tab when
                    they just want to skim the answer. */}
                {answer.fileMimeType === "application/pdf" && (
                  <iframe
                    src={answer.fileUrl}
                    title={answer.fileName ?? "Uploaded PDF"}
                    className="mt-3 block h-[60vh] w-full rounded-md border border-gray-200 bg-white"
                  />
                )}
                {answer.fileMimeType?.startsWith("image/") && (
                  <img
                    src={answer.fileUrl}
                    alt={answer.fileName ?? "Uploaded image"}
                    className="mt-3 block max-h-[60vh] w-auto rounded-md border border-gray-200"
                  />
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <FileIcon className="h-5 w-5 text-gray-500" />
                <span className="italic text-gray-400">No file uploaded.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {isManual && draft && (
        <div className="mt-5 rounded-xl border border-fellowship-navy/20 bg-fellowship-navy/5 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-fellowship-navy">
              Your grade
            </p>
            {draft.score === null && (
              <span className="text-xs font-medium text-warning-700">
                Needs grading
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { value: 0, label: "Wrong (0%)" },
              { value: 0.5, label: "Partial (50%)" },
              { value: 1, label: "Correct (100%)" },
            ].map((opt) => {
              const selected = draft.score === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onScoreChange(opt.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    selected
                      ? "border-fellowship-navy bg-fellowship-navy text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-fellowship-navy"
                  } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <label className="mt-4 block">
            <span className="text-xs font-medium text-gray-600">
              Feedback (optional, shown to the fellow)
            </span>
            <textarea
              rows={3}
              value={draft.feedback}
              disabled={disabled}
              onChange={(e) => onFeedbackChange(e.target.value)}
              placeholder="What did they get right? What should they revisit?"
              className="mt-1 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10 disabled:bg-gray-50"
            />
          </label>
        </div>
      )}
    </li>
  );
}

function StatusBadge({ status }: { status: GraderAttempt["status"] }) {
  if (status === "passed") return <Badge color="success" variant="light">Passed</Badge>;
  if (status === "failed") return <Badge color="error" variant="light">Failed</Badge>;
  return <Badge color="info" variant="light">Pending review</Badge>;
}

function kindLabel(kind: GraderAttemptAnswer["question"]["kind"]): string {
  switch (kind) {
    case "multiple_choice":
      return "Multiple choice";
    case "short_text":
      return "Short answer";
    case "essay":
      return "Essay";
    case "attachment":
      return "File upload";
  }
}

function formatAnswerMime(mime: string | null): string {
  if (!mime) return "file";
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/")) return "Image";
  if (mime.includes("word")) return "Word doc";
  if (mime.includes("presentation")) return "Slide deck";
  if (mime.startsWith("text/")) return "Text";
  return mime;
}

function formatAnswerBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
