"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AnswerFileUpload from "@/components/fellow/AnswerFileUpload";
import Button from "@/components/ui/button/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { toast } from "@/lib/toast";
import { CheckCircleIcon, TimeIcon } from "@/icons";
import {
  submitAttempt,
  type FellowAnswer,
  type FellowAssessment,
  type FellowQuestion,
  type UploadedAnswerFile,
} from "@/lib/api/fellow-assessment";

type AnswerState = {
  /** Selected choice id for multiple_choice. */
  choiceId?: string | null;
  /** Free text for short_text / essay. */
  text?: string;
  /** Uploaded file for attachment — already in Spaces, URL ready for submit. */
  uploaded?: UploadedAnswerFile | null;
};

/**
 * Fellow assessment-taking form (BRD §6.5).
 *
 * Renders the four question kinds with the right input per kind:
 *   - multiple_choice → radios (one correct, server auto-grades)
 *   - short_text      → single-line input (manually graded)
 *   - essay           → textarea (manually graded)
 *   - attachment      → file picker (manually graded; upload TBD)
 *
 * Submit is wired through the BFF — backend persistence of attempts is the
 * next slice of work; the page falls back to a "submitted, awaiting review"
 * confirmation when the persistence endpoint doesn't exist yet.
 */
export default function AssessmentTaker({
  assessment,
}: {
  assessment: FellowAssessment;
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(
    assessment.timeLimitMinutes * 60,
  );
  const startedAt = useRef<number>(Date.now());

  // Refs so the timer interval can read the latest values without depending
  // on them — otherwise every keystroke would tear down and recreate the
  // interval, and a fellow typing fast would freeze the clock entirely.
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  const submittingRef = useRef(false);
  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  // Tick every second; auto-submit when time runs out. Effect runs once on
  // mount (until `submitted` flips true) — does not depend on `answers`.
  useEffect(() => {
    if (submitted) return;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      const remaining = assessment.timeLimitMinutes * 60 - elapsed;
      setSecondsLeft(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(id);
        if (!submittingRef.current) {
          void runSubmit({ auto: true, snapshot: answersRef.current });
        }
      }
    }, 1000);
    return () => clearInterval(id);
    // runSubmit is stable enough — it reads the snapshot we pass in and
    // refs for everything else. We intentionally exclude it from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment.timeLimitMinutes, submitted]);

  const setAnswer = (qid: string, patch: AnswerState) =>
    setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], ...patch } }));

  const allAnswered = useMemo(
    () => assessment.questions.every((q) => isAnswered(q, answers[q.id])),
    [assessment.questions, answers],
  );

  async function runSubmit({
    auto,
    snapshot,
  }: {
    auto: boolean;
    snapshot: Record<string, AnswerState>;
  }) {
    if (submitted || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    const payload = assessment.questions.map<FellowAnswer>((q) =>
      buildAnswer(q, snapshot[q.id]),
    );

    try {
      const attempt = await submitAttempt(assessment.moduleId, payload);
      setSubmitted(true);
      const headline = auto ? "Time's up — answers submitted" : "Answers submitted";
      toast.success(headline, describeResult(attempt));
      router.push(`/attempts/${encodeURIComponent(attempt.id)}`);
    } catch (err) {
      toast.errorFromException("Couldn't submit your answers", err);
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (submitted || submitting) return;
    const ok = await confirm({
      title: "Submit your answers?",
      message: allAnswered
        ? "Once submitted, you can't change your answers."
        : "Some questions are unanswered. Submit anyway?",
      confirmLabel: "Submit",
    });
    if (!ok) return;
    await runSubmit({ auto: false, snapshot: answers });
  }

  return (
    <>
      <header className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-title-sm font-bold text-gray-800">
              {assessment.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {assessment.questions.length} question
              {assessment.questions.length === 1 ? "" : "s"} · pass mark{" "}
              {assessment.passingScore}%
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
              secondsLeft < 60
                ? "bg-error-50 text-error-700"
                : "bg-warning-50 text-fellowship-navy"
            }`}
          >
            <TimeIcon className="h-4 w-4" />
            {formatClock(secondsLeft)}
          </div>
        </div>
      </header>

      <ol className="flex flex-col gap-4">
        {assessment.questions.map((q, idx) => (
          <QuestionForm
            key={q.id}
            question={q}
            index={idx}
            answer={answers[q.id]}
            onAnswer={(patch) => setAnswer(q.id, patch)}
            disabled={submitted || submitting}
          />
        ))}
      </ol>

      <footer
        className="sticky mt-2 flex justify-end rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-md md:p-5"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
      >
        <Button
          size="md"
          variant="fellowship"
          onClick={() => handleSubmit()}
          disabled={submitted || submitting}
        >
          {submitting ? "Submitting…" : "Submit assessment"}
        </Button>
      </footer>

      {dialog}
    </>
  );
}

function QuestionForm({
  question: q,
  index,
  answer,
  onAnswer,
  disabled,
}: {
  question: FellowQuestion;
  index: number;
  answer: AnswerState | undefined;
  onAnswer: (patch: AnswerState) => void;
  disabled: boolean;
}) {
  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Question {index + 1}
        </span>
        <span className="text-xs text-gray-400">{kindLabel(q.kind)}</span>
      </div>
      <p className="mt-2 text-sm font-medium text-gray-800 whitespace-pre-wrap">
        {q.prompt}
      </p>

      <div className="mt-4">
        {q.kind === "multiple_choice" && (
          <ul className="flex flex-col gap-2">
            {q.choices.map((c) => {
              const selected = answer?.choiceId === c.id;
              return (
                <li key={c.id}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selected
                        ? "border-fellowship-navy bg-fellowship-navy/5"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected
                          ? "border-fellowship-navy bg-fellowship-navy text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {selected && <CheckCircleIcon className="h-3 w-3" />}
                    </span>
                    <input
                      type="radio"
                      name={q.id}
                      className="sr-only"
                      checked={selected}
                      disabled={disabled}
                      onChange={() => onAnswer({ choiceId: c.id })}
                    />
                    <span className="text-sm text-gray-800">{c.text}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {q.kind === "short_text" && (
          <input
            type="text"
            value={answer?.text ?? ""}
            disabled={disabled}
            maxLength={q.maxLength ?? undefined}
            onChange={(e) => onAnswer({ text: e.target.value })}
            placeholder="Type your answer…"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10 disabled:bg-gray-50"
          />
        )}

        {q.kind === "essay" && (
          <>
            <textarea
              rows={6}
              value={answer?.text ?? ""}
              disabled={disabled}
              maxLength={q.maxLength ?? undefined}
              onChange={(e) => onAnswer({ text: e.target.value })}
              placeholder="Write your response…"
              className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10 disabled:bg-gray-50"
            />
            {q.maxLength && (
              <p className="mt-1 text-right text-xs text-gray-500">
                {(answer?.text ?? "").length} / {q.maxLength}
              </p>
            )}
          </>
        )}

        {q.kind === "attachment" && (
          <AnswerFileUpload
            current={answer?.uploaded ?? null}
            disabled={disabled}
            onChange={(next) => onAnswer({ uploaded: next })}
          />
        )}
      </div>
    </li>
  );
}

function isAnswered(q: FellowQuestion, a: AnswerState | undefined): boolean {
  if (!a) return false;
  switch (q.kind) {
    case "multiple_choice":
      return Boolean(a.choiceId);
    case "short_text":
    case "essay":
      return (a.text ?? "").trim().length > 0;
    case "attachment":
      // "Answered" = file actually uploaded (we have a URL). The
      // intermediate "file picked but upload failed" state shouldn't
      // count — submitting that would lose the fellow's intent.
      return Boolean(a.uploaded?.fileUrl);
  }
}

function buildAnswer(q: FellowQuestion, a: AnswerState | undefined): FellowAnswer {
  switch (q.kind) {
    case "multiple_choice":
      return { questionId: q.id, kind: "multiple_choice", choiceId: a?.choiceId ?? null };
    case "short_text":
      return { questionId: q.id, kind: "short_text", text: a?.text ?? "" };
    case "essay":
      return { questionId: q.id, kind: "essay", text: a?.text ?? "" };
    case "attachment":
      return {
        questionId: q.id,
        kind: "attachment",
        fileName: a?.uploaded?.fileName ?? null,
        fileUrl: a?.uploaded?.fileUrl ?? null,
        fileMimeType: a?.uploaded?.fileMimeType ?? null,
        fileBytes: a?.uploaded?.fileBytes ?? null,
      };
  }
}

function kindLabel(kind: FellowQuestion["kind"]): string {
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

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function describeResult(attempt: {
  status: "passed" | "failed" | "pending_review";
  score: number | null;
}): string {
  if (attempt.status === "passed") {
    return `You scored ${attempt.score}% — pass mark cleared. Nice work.`;
  }
  if (attempt.status === "failed") {
    return `You scored ${attempt.score}% — under the pass mark. Review the lessons and retake when you're ready.`;
  }
  return "Multiple-choice has been auto-graded. Written and uploaded answers are in the faculty queue — your final score will appear once they finish.";
}
