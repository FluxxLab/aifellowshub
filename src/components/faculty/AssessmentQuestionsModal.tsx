"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import SelectField from "@/components/form/SelectField";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { CheckCircleIcon, PlusIcon, TrashBinIcon } from "@/icons";
import {
  addAssessmentQuestion,
  deleteAssessmentQuestion,
  updateAssessmentQuestion,
  type AssessmentQuestion,
  type AssessmentQuestionKind,
  type FacultyAssessmentMeta,
} from "@/lib/api/faculty";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  assessment: FacultyAssessmentMeta;
  onChange: (questions: AssessmentQuestion[]) => void;
};

type EditorChoice = { id: string; text: string; isCorrect: boolean };
type EditorQuestion = {
  id: string | null; // null = unsaved draft (not on backend yet)
  prompt: string;
  kind: AssessmentQuestionKind;
  choices: EditorChoice[];
  maxLength: number | null;
  dirty: boolean;
};

const KIND_OPTIONS: { value: AssessmentQuestionKind; label: string }[] = [
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "short_text", label: "Short text" },
  { value: "essay", label: "Essay" },
  { value: "attachment", label: "File attachment" },
];

const KIND_HINTS: Record<AssessmentQuestionKind, string> = {
  multiple_choice: "Fellows pick one correct option.",
  short_text: "Fellows type a brief answer (1–2 sentences).",
  essay: "Fellows write a long-form response, graded manually.",
  attachment: "Fellows upload a file (PDF, image, or doc) as their answer.",
};

/**
 * Question editor for a module's assessment (BRD §6.5).
 *
 * Supports four question kinds: multiple_choice (auto-graded), short_text
 * and essay (manually graded by faculty), and attachment (file upload).
 * Choices only render for multiple_choice; maxLength only for short_text /
 * essay.
 */
export default function AssessmentQuestionsModal({
  isOpen,
  onClose,
  moduleId,
  assessment,
  onChange,
}: Props) {
  const [questions, setQuestions] = useState<EditorQuestion[]>(() =>
    assessment.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      kind: q.kind,
      choices: q.choices.map((c) => ({
        id: c.id,
        text: c.text,
        isCorrect: c.isCorrect,
      })),
      maxLength: q.maxLength,
      dirty: false,
    })),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const emit = (next: EditorQuestion[]) => {
    setQuestions(next);
    onChange(
      next
        .filter((q): q is EditorQuestion & { id: string } => q.id !== null)
        .map((q) => ({
          id: q.id,
          prompt: q.prompt,
          kind: q.kind,
          choices: q.choices,
          maxLength: q.maxLength,
        })),
    );
  };

  const patch = (idx: number, fn: (q: EditorQuestion) => EditorQuestion) => {
    emit(questions.map((q, i) => (i === idx ? { ...fn(q), dirty: true } : q)));
  };

  const newQuestion = () => {
    emit([
      ...questions,
      {
        id: null,
        prompt: "",
        kind: "multiple_choice",
        choices: [
          { id: `tmp-${Date.now()}-1`, text: "", isCorrect: true },
          { id: `tmp-${Date.now()}-2`, text: "", isCorrect: false },
        ],
        maxLength: null,
        dirty: true,
      },
    ]);
  };

  const removeQuestion = async (idx: number) => {
    const q = questions[idx];
    if (q.id) {
      const ok = await confirm({
        title: "Delete this question?",
        message: "This will remove the question from the assessment.",
        confirmLabel: "Delete",
        tone: "danger",
      });
      if (!ok) return;
      setBusyId(q.id);
      try {
        await deleteAssessmentQuestion(q.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't delete question.");
        setBusyId(null);
        return;
      }
      setBusyId(null);
    }
    emit(questions.filter((_, i) => i !== idx));
  };

  const saveQuestion = async (idx: number) => {
    const q = questions[idx];
    const validationError = validate(q);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setBusyId(q.id ?? `new-${idx}`);
    try {
      const payload = {
        prompt: q.prompt.trim(),
        kind: q.kind,
        choices:
          q.kind === "multiple_choice"
            ? q.choices.map((c) => ({ text: c.text.trim(), isCorrect: c.isCorrect }))
            : undefined,
        maxLength:
          q.kind === "short_text" || q.kind === "essay" ? q.maxLength : null,
      };
      if (q.id) {
        const saved = await updateAssessmentQuestion(q.id, payload);
        emit(
          questions.map((x, i) =>
            i === idx
              ? {
                  id: saved.id,
                  prompt: saved.prompt,
                  kind: saved.kind,
                  choices: saved.choices,
                  maxLength: saved.maxLength,
                  dirty: false,
                }
              : x,
          ),
        );
      } else {
        const saved = await addAssessmentQuestion(moduleId, payload);
        emit(
          questions.map((x, i) =>
            i === idx
              ? {
                  id: saved.id,
                  prompt: saved.prompt,
                  kind: saved.kind,
                  choices: saved.choices,
                  maxLength: saved.maxLength,
                  dirty: false,
                }
              : x,
          ),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save question.");
    }
    setBusyId(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-2xl">
      <div className="flex max-h-[85vh] flex-col">
        <header className="border-b border-gray-100 px-5 py-4 sm:px-6">
          <h2 className="text-title-sm font-bold text-gray-800">
            Assessment questions
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {assessment.title} · pass mark {assessment.passingScore}%
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {error && (
            <p className="mb-3 rounded-md bg-error-50 p-2 text-xs font-medium text-error-700">
              {error}
            </p>
          )}

          {questions.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              No questions yet. Add the first one to get started.
            </p>
          ) : (
            <ol className="flex flex-col gap-4">
              {questions.map((q, idx) => (
                <QuestionEditor
                  key={q.id ?? `tmp-${idx}`}
                  question={q}
                  index={idx}
                  busy={busyId === (q.id ?? `new-${idx}`)}
                  onPatch={(fn) => patch(idx, fn)}
                  onRemove={() => removeQuestion(idx)}
                  onSave={() => saveQuestion(idx)}
                />
              ))}
            </ol>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={newQuestion}
            className="mt-4"
          >
            <PlusIcon className="h-4 w-4" />
            Add question
          </Button>
        </div>

        <footer className="border-t border-gray-100 px-5 py-3 sm:px-6">
          <div className="flex justify-end">
            <Button size="sm" variant="fellowship" onClick={onClose}>
              Done
            </Button>
          </div>
        </footer>
      </div>
      {confirmDialog}
    </Modal>
  );
}

/** Returns a human-readable error string, or null when the question is valid. */
function validate(q: EditorQuestion): string | null {
  if (q.prompt.trim().length < 3) {
    return "Each question needs a prompt of at least 3 characters.";
  }
  if (q.kind === "multiple_choice") {
    if (q.choices.length < 2) return "Multiple choice needs at least 2 choices.";
    if (q.choices.some((c) => c.text.trim().length === 0)) {
      return "Every choice needs text.";
    }
    const correct = q.choices.filter((c) => c.isCorrect).length;
    if (correct !== 1) return "Mark exactly one choice as correct.";
  }
  return null;
}

function QuestionEditor({
  question: q,
  index,
  busy,
  onPatch,
  onRemove,
  onSave,
}: {
  question: EditorQuestion;
  index: number;
  busy: boolean;
  onPatch: (fn: (q: EditorQuestion) => EditorQuestion) => void;
  onRemove: () => void;
  onSave: () => void;
}) {
  const setPrompt = (v: string) => onPatch((p) => ({ ...p, prompt: v }));
  const setKind = (kind: AssessmentQuestionKind) =>
    onPatch((p) => {
      // When switching INTO multiple_choice from a non-MC kind, seed two
      // empty choices so the editor renders something usable. Switching
      // OUT keeps the existing choices in memory but they're hidden — saving
      // will discard them server-side.
      const choices =
        kind === "multiple_choice" && p.choices.length < 2
          ? [
              { id: `tmp-${Date.now()}-1`, text: "", isCorrect: true },
              { id: `tmp-${Date.now()}-2`, text: "", isCorrect: false },
            ]
          : p.choices;
      const maxLength =
        kind === "short_text" || kind === "essay" ? p.maxLength : null;
      return { ...p, kind, choices, maxLength };
    });
  const setChoiceText = (cid: string, text: string) =>
    onPatch((p) => ({
      ...p,
      choices: p.choices.map((c) => (c.id === cid ? { ...c, text } : c)),
    }));
  const setCorrect = (cid: string) =>
    onPatch((p) => ({
      ...p,
      choices: p.choices.map((c) => ({ ...c, isCorrect: c.id === cid })),
    }));
  const removeChoice = (cid: string) =>
    onPatch((p) => ({ ...p, choices: p.choices.filter((c) => c.id !== cid) }));
  const addChoice = () =>
    onPatch((p) => ({
      ...p,
      choices: [
        ...p.choices,
        { id: `tmp-${Date.now()}`, text: "", isCorrect: false },
      ],
    }));
  const setMaxLength = (v: number | null) =>
    onPatch((p) => ({ ...p, maxLength: v }));

  const valid = validate(q) === null;

  return (
    <li className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Question {index + 1}
          {q.id === null && <span className="ml-2 text-warning-600">unsaved</span>}
          {q.id !== null && q.dirty && <span className="ml-2 text-warning-600">edited</span>}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove question"
          disabled={busy}
          className="rounded-md border border-gray-200 p-1 text-gray-400 hover:border-error-200 hover:bg-error-50 hover:text-error-500 disabled:opacity-50"
        >
          <TrashBinIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-start">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Question type
          </label>
          <SelectField<AssessmentQuestionKind>
            size="sm"
            value={q.kind}
            onChange={setKind}
            options={KIND_OPTIONS}
            ariaLabel="Question type"
          />
        </div>
        {(q.kind === "short_text" || q.kind === "essay") && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Max characters
            </label>
            <input
              type="number"
              min={1}
              max={50000}
              value={q.maxLength ?? ""}
              onChange={(e) => {
                const n = e.target.value === "" ? null : Number(e.target.value);
                setMaxLength(Number.isFinite(n as number) ? (n as number) : null);
              }}
              placeholder="No cap"
              className="h-8 w-32 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
            />
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-500">{KIND_HINTS[q.kind]}</p>

      <textarea
        rows={2}
        value={q.prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="What's the question?"
        className="mt-3 w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
      />

      {q.kind === "multiple_choice" && (
        <>
          <ul className="mt-3 flex flex-col gap-2">
            {q.choices.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCorrect(c.id)}
                  aria-label={c.isCorrect ? "Correct answer" : "Mark as correct"}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    c.isCorrect
                      ? "border-success-500 bg-success-500 text-white"
                      : "border-gray-300 bg-white hover:border-success-400"
                  }`}
                >
                  {c.isCorrect && <CheckCircleIcon className="h-3.5 w-3.5" />}
                </button>
                <input
                  type="text"
                  value={c.text}
                  onChange={(e) => setChoiceText(c.id, e.target.value)}
                  placeholder="Choice text…"
                  className="h-9 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
                />
                <button
                  type="button"
                  onClick={() => removeChoice(c.id)}
                  aria-label="Remove choice"
                  disabled={q.choices.length <= 2}
                  className="rounded-md border border-gray-200 p-1 text-gray-400 hover:border-error-200 hover:bg-error-50 hover:text-error-500 disabled:opacity-30"
                >
                  <TrashBinIcon className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={addChoice}>
              Add choice
            </Button>
          </div>
        </>
      )}

      {(q.kind === "short_text" || q.kind === "essay") && (
        <div className="mt-3 rounded-md border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-500">
          Fellows will see a {q.kind === "essay" ? "large" : "single-line"} text
          field
          {q.maxLength ? ` (max ${q.maxLength} chars)` : ""}. Manual grading is
          required — there is no auto-mark.
        </div>
      )}

      {q.kind === "attachment" && (
        <div className="mt-3 rounded-md border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-500">
          Fellows will see a file uploader. Server enforces a max upload size;
          faculty grade manually after reviewing the submission.
        </div>
      )}

      <div className="mt-3 flex items-center justify-end">
        <Button
          size="sm"
          variant="fellowship"
          onClick={onSave}
          disabled={!valid || busy || (!q.dirty && q.id !== null)}
        >
          {busy ? "Saving…" : q.id ? "Save changes" : "Save question"}
        </Button>
      </div>
    </li>
  );
}
