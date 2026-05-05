"use client";
import React, { useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import SelectField from "@/components/form/SelectField";
import Button from "@/components/ui/button/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import {
  DocsIcon,
  FileIcon,
  PencilIcon,
  TimeIcon,
  TrashBinIcon,
  VideoIcon,
} from "@/icons";
import LessonContentUpload from "@/components/faculty/LessonContentUpload";
import {
  addModuleLesson,
  addModuleResource,
  deleteLesson,
  deleteModuleResource,
  reorderLesson,
  saveModuleDraft,
  submitModuleForReview,
  updateLesson as updateLessonApi,
  type AssessmentQuestion,
  type FacultyLesson,
  type FacultyModuleDetail,
  type FacultyModuleStatus,
  type FacultyResource,
  type FacultySession,
} from "@/lib/api/faculty";
import AssessmentQuestionsModal from "./AssessmentQuestionsModal";
import FacultySessionCard from "./FacultySessionCard";

/**
 * Faculty module editor (BRD §6.3, §6.5).
 *
 * Phase 1: editing is local-state only.
 * Phase 2: PATCH /faculty/modules/:id — server validates, persists, and
 * may bump status from "published" to "draft" if the change is non-trivial.
 */
export default function FacultyModuleEditor({
  initial,
}: {
  initial: FacultyModuleDetail;
}) {
  const [status, setStatus] = useState<FacultyModuleStatus>(initial.status);
  const [title, setTitle] = useState(initial.title);
  const [summary, setSummary] = useState(initial.summary);
  const [lessons, setLessons] = useState<FacultyLesson[]>(initial.lessons);
  const [resources, setResources] = useState<FacultyResource[]>(initial.resources);
  const [session, setSession] = useState<FacultySession | null>(initial.session);
  const [assessmentQuestions, setAssessmentQuestions] = useState<
    AssessmentQuestion[]
  >(initial.assessment.questions);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">("idle");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "submitted">("idle");

  const dirty =
    title !== initial.title ||
    summary !== initial.summary ||
    JSON.stringify(lessons) !== JSON.stringify(initial.lessons);

  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog: confirmDialog } = useConfirm();

  const onSaveDraft = async () => {
    setError(null);
    setSavingState("saving");
    try {
      // Real PATCH — backend auto-reverts published → draft on content change.
      const updated = await saveModuleDraft(initial.id, { title, summary });
      setStatus(updated.status);
      setSavingState("saved");
      window.setTimeout(() => setSavingState("idle"), 1800);
    } catch (err) {
      // Backend offline / 404 (mock id) — fall back to local optimistic update.
      if (status === "published") setStatus("draft");
      setSavingState("saved");
      window.setTimeout(() => setSavingState("idle"), 1800);
      if (err instanceof Error && !err.message.includes("not found")) {
        setError(err.message);
      }
    }
  };

  const onSubmitForReview = async () => {
    setError(null);
    setSubmitState("submitting");
    try {
      const updated = await submitModuleForReview(initial.id);
      setStatus(updated.status);
      setSubmitState("submitted");
    } catch (err) {
      // Fall back to local state so the demo still works without backend.
      setStatus("under-review");
      setSubmitState("submitted");
      if (err instanceof Error && !err.message.includes("not found")) {
        setError(err.message);
      }
    }
  };

  /** Local-only patch — used during typing so the editor stays responsive. */
  const patchLesson = (id: string, patch: Partial<FacultyLesson>) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
    );
  };

  /**
   * Patch local AND fire-and-forget save. Used for discrete-pick fields
   * (kind, duration) where every change is a meaningful save event.
   */
  const patchLessonAndSave = async (
    id: string,
    patch: Partial<FacultyLesson>,
  ) => {
    const current = lessons.find((l) => l.id === id);
    if (!current) return;
    const merged = { ...current, ...patch };
    setLessons((prev) => prev.map((l) => (l.id === id ? merged : l)));
    if (merged.title.trim().length < 3) return; // backend rejects shorter
    try {
      await updateLessonApi(id, {
        title: merged.title,
        summary: merged.summary,
        kind: merged.kind,
        durationMinutes: merged.durationMinutes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save lesson.");
    }
  };

  /** Save current local state for a lesson — used on text-input blur. */
  const saveLesson = async (id: string) => {
    const lesson = lessons.find((l) => l.id === id);
    if (!lesson) return;
    if (lesson.title.trim().length < 3) return;
    try {
      await updateLessonApi(id, {
        title: lesson.title,
        summary: lesson.summary,
        kind: lesson.kind,
        durationMinutes: lesson.durationMinutes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save lesson.");
    }
  };

  const removeLesson = async (id: string) => {
    const ok = await confirm({
      title: "Delete this lesson?",
      message: "This will remove the lesson from the module.",
      confirmLabel: "Delete lesson",
      tone: "danger",
    });
    if (!ok) return;
    const previous = lessons;
    setLessons((prev) => prev.filter((l) => l.id !== id));
    try {
      await deleteLesson(id);
    } catch (err) {
      // Restore on failure.
      setLessons(previous);
      setError(err instanceof Error ? err.message : "Couldn't delete lesson.");
    }
  };

  const moveLesson = async (id: string, direction: -1 | 1) => {
    const idx = lessons.findIndex((l) => l.id === id);
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= lessons.length) return;
    const newLessons = [...lessons];
    [newLessons[idx], newLessons[target]] = [newLessons[target], newLessons[idx]];
    const previous = lessons;
    setLessons(newLessons);
    const beforeId = newLessons[target - 1]?.id ?? null;
    const afterId = newLessons[target + 1]?.id ?? null;
    try {
      await reorderLesson(id, { beforeId, afterId });
    } catch (err) {
      setLessons(previous);
      setError(err instanceof Error ? err.message : "Couldn't reorder lesson.");
    }
  };

  const addLesson = async () => {
    try {
      const created = await addModuleLesson(initial.id, {
        title: "Untitled lesson",
        summary: "",
        kind: "reading",
        durationMinutes: 20,
      });
      setLessons((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add lesson.");
    }
  };

  /* ---------- resources ---------- */

  const addResource = async (payload: {
    title: string;
    url: string;
    kind: FacultyResource["kind"];
    description: string;
    tags: string[];
    featured: boolean;
    durationMinutes: number;
  }) => {
    try {
      const created = await addModuleResource(initial.id, payload);
      setResources((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add resource.");
      throw err;
    }
  };

  const removeResource = async (id: string) => {
    const ok = await confirm({
      title: "Remove this resource?",
      message: "Fellows won't see it on the module page anymore.",
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    const previous = resources;
    setResources((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteModuleResource(id);
    } catch (err) {
      setResources(previous);
      setError(err instanceof Error ? err.message : "Couldn't remove resource.");
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Faculty home", href: "/faculty" },
          { label: "My modules", href: "/faculty/modules" },
          { label: initial.title },
        ]}
      />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Week {initial.weekNumber}
              </span>
              <StatusBadge status={status} />
              {dirty && status === "published" && (
                <span className="text-xs text-warning-700">
                  Saving will move this back to draft.
                </span>
              )}
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-2xl font-bold text-gray-800 hover:border-gray-200 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10 sm:text-3xl"
            />
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="mt-2 w-full resize-y rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-gray-600 hover:border-gray-200 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span>
              <span className="font-semibold text-gray-700">
                {initial.enrolledFellows}
              </span>{" "}
              active fellows
            </span>
            <span className="text-gray-300">·</span>
            <span>
              Avg score{" "}
              <span className="font-semibold text-gray-700">
                {initial.averageAssessmentScore !== null
                  ? `${initial.averageAssessmentScore}%`
                  : "—"}
              </span>
            </span>
            <span className="text-gray-300">·</span>
            <span>
              {initial.publishedAt
                ? `Last published ${relativeDate(initial.publishedAt)}`
                : "Not yet published"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {error && (
              <span className="text-xs font-medium text-error-600">{error}</span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onSaveDraft}
              disabled={savingState === "saving"}
            >
              {savingState === "saving"
                ? "Saving…"
                : savingState === "saved"
                ? "Saved ✓"
                : "Save draft"}
            </Button>
            <Button
              size="sm"
              variant="fellowship"
              onClick={onSubmitForReview}
              disabled={
                status === "under-review" ||
                submitState === "submitting" ||
                submitState === "submitted"
              }
            >
              {submitState === "submitted" || status === "under-review"
                ? "Submitted ✓"
                : submitState === "submitting"
                ? "Submitting…"
                : "Submit for review"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Lessons</h2>
          <Button size="sm" variant="outline" onClick={addLesson}>
            Add lesson
          </Button>
        </div>

        <ol className="mt-4 flex flex-col gap-3">
          {lessons.map((l, idx) => (
            <LessonRow
              key={l.id}
              lesson={l}
              isFirst={idx === 0}
              isLast={idx === lessons.length - 1}
              onPatch={(patch) => patchLesson(l.id, patch)}
              onPatchAndSave={(patch) => patchLessonAndSave(l.id, patch)}
              onSave={() => saveLesson(l.id)}
              onRemove={() => removeLesson(l.id)}
              onMoveUp={() => moveLesson(l.id, -1)}
              onMoveDown={() => moveLesson(l.id, 1)}
            />
          ))}
        </ol>

        {lessons.length === 0 && (
          <p className="mt-4 text-sm text-gray-500">
            No lessons — add one to start authoring.
          </p>
        )}
      </section>

      <FacultySessionCard
        moduleId={initial.id}
        session={session}
        onChange={setSession}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">
        <ResourcesCard
          resources={resources}
          onAdd={addResource}
          onRemove={removeResource}
        />
        <AssessmentCard
          moduleId={initial.id}
          assessment={{
            ...initial.assessment,
            questions: assessmentQuestions,
            questionCount: assessmentQuestions.length,
          }}
          onAssessmentChange={setAssessmentQuestions}
        />
      </div>
      {confirmDialog}
    </div>
  );
}

function LessonRow({
  lesson,
  isFirst,
  isLast,
  onPatch,
  onPatchAndSave,
  onSave,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  lesson: FacultyLesson;
  isFirst: boolean;
  isLast: boolean;
  /** Local-only patch — used during typing for responsive editing. */
  onPatch: (patch: Partial<FacultyLesson>) => void;
  /** Atomic patch + save — for discrete fields (kind, duration on commit). */
  onPatchAndSave: (patch: Partial<FacultyLesson>) => void;
  /** Save current local state — for text-input blur. */
  onSave: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <li className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1 pt-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="rounded border border-gray-200 px-1 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="rounded border border-gray-200 px-1 text-xs text-gray-500 hover:bg-gray-50 disabled:opacity-30"
            aria-label="Move down"
          >
            ↓
          </button>
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <SelectField<FacultyLesson["kind"]>
              size="sm"
              value={lesson.kind}
              onChange={(v) => onPatchAndSave({ kind: v })}
              options={[
                { value: "reading", label: "Reading" },
                { value: "video", label: "Video" },
                { value: "exercise", label: "Exercise" },
              ]}
              className="w-32"
            />
            <span className="text-gray-300">·</span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <TimeIcon className="h-3.5 w-3.5" />
              <input
                type="number"
                min={5}
                max={120}
                value={lesson.durationMinutes}
                onChange={(e) =>
                  onPatch({ durationMinutes: Number(e.target.value) })
                }
                onBlur={onSave}
                className="w-14 rounded-md border border-gray-200 bg-white px-1 py-0.5 text-xs text-gray-700 focus:border-fellowship-navy focus:outline-hidden"
              />
              min
            </span>
          </div>

          <input
            type="text"
            value={lesson.title}
            onChange={(e) => onPatch({ title: e.target.value })}
            onBlur={onSave}
            className="mt-2 w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-gray-800 hover:border-gray-200 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
          />
          <textarea
            rows={2}
            value={lesson.summary}
            onChange={(e) => onPatch({ summary: e.target.value })}
            onBlur={onSave}
            placeholder="Lesson summary…"
            className="mt-1 w-full resize-y rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-gray-600 hover:border-gray-200 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
          />

          {/* Content upload — directly browser → DigitalOcean Spaces.
              On success the local lesson state gets the new contentUrl
              so the row immediately re-renders in the "attached" state
              without a refetch. */}
          <div className="mt-3">
            <LessonContentUpload
              lesson={lesson}
              onChange={(next) =>
                onPatch({
                  contentUrl: next.contentUrl,
                  contentMimeType: next.contentMimeType,
                  contentBytes: next.contentBytes,
                })
              }
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove lesson"
          className="rounded-md border border-gray-200 p-1.5 text-gray-400 hover:border-error-200 hover:bg-error-50 hover:text-error-500"
        >
          <TrashBinIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

function ResourcesCard({
  resources,
  onAdd,
  onRemove,
}: {
  resources: FacultyResource[];
  onAdd: (payload: {
    title: string;
    url: string;
    kind: FacultyResource["kind"];
    description: string;
    tags: string[];
    featured: boolean;
    durationMinutes: number;
  }) => Promise<void>;
  onRemove: (id: string) => void;
}) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<FacultyResource["kind"]>("link");
  const [description, setDescription] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [featured, setFeatured] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = title.trim().length >= 2 && url.trim().length > 0;

  const reset = () => {
    setTitle("");
    setUrl("");
    setKind("link");
    setDescription("");
    setTagsText("");
    setFeatured(false);
    setDurationMinutes("");
  };

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      const tags = tagsText
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 12);
      const dur = Number(durationMinutes);
      await onAdd({
        title: title.trim(),
        url: url.trim(),
        kind,
        description: description.trim(),
        tags,
        featured,
        durationMinutes: Number.isFinite(dur) && dur > 0 ? dur : 0,
      });
      reset();
      setComposerOpen(false);
    } catch {
      // error surfaced by parent
    }
    setBusy(false);
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Resources</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setComposerOpen((o) => !o)}
        >
          {composerOpen ? "Cancel" : "Add resource"}
        </Button>
      </div>

      {composerOpen && (
        <div className="mt-3 space-y-2 rounded-lg border border-fellowship-navy/30 bg-gray-50 p-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. EU AI Act — annotated)"
            className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL (https://…)"
            className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
          />
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="One-line description shown in the library (optional)"
            className="w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
          />
          <div className="flex flex-wrap items-center gap-2">
            <SelectField<FacultyResource["kind"]>
              size="sm"
              value={kind}
              onChange={setKind}
              options={[
                { value: "link", label: "Link" },
                { value: "pdf", label: "PDF" },
                { value: "video", label: "Video" },
              ]}
              className="w-32"
            />
            <input
              type="number"
              min={0}
              max={600}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="min"
              aria-label="Estimated duration in minutes"
              className="h-9 w-20 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
            />
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="tags, comma, separated"
              className="h-9 flex-1 min-w-32 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
            />
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Featured
            </label>
            <Button
              size="sm"
              variant="fellowship"
              onClick={submit}
              disabled={!canSubmit || busy}
            >
              {busy ? "Adding…" : "Add"}
            </Button>
          </div>
        </div>
      )}

      {resources.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">No resources attached yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100">
          {resources.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-center gap-3 hover:text-fellowship-navy"
              >
                <ResourceIcon kind={r.kind} />
                <span className="truncate text-sm text-gray-800">{r.title}</span>
              </a>
              <span className="text-xs uppercase tracking-wide text-gray-500">
                {r.kind}
              </span>
              <button
                type="button"
                onClick={() => onRemove(r.id)}
                aria-label={`Remove ${r.title}`}
                className="rounded-md border border-gray-200 p-1.5 text-gray-400 hover:border-error-200 hover:bg-error-50 hover:text-error-500"
              >
                <TrashBinIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AssessmentCard({
  moduleId,
  assessment,
  onAssessmentChange,
}: {
  moduleId: string;
  assessment: FacultyModuleDetail["assessment"];
  onAssessmentChange: (questions: AssessmentQuestion[]) => void;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Assessment</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditorOpen(true)}
        >
          <PencilIcon className="h-3.5 w-3.5" />
          Edit questions
        </Button>
      </div>
      {editorOpen && (
        <AssessmentQuestionsModal
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          moduleId={moduleId}
          assessment={assessment}
          onChange={onAssessmentChange}
        />
      )}
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
        <div className="flex justify-between">
          <dt className="text-gray-500">Avg score</dt>
          <dd className="text-gray-800">
            {assessment.averageScore !== null
              ? `${assessment.averageScore}%`
              : "No attempts yet"}
          </dd>
        </div>
      </dl>
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

function StatusBadge({ status }: { status: FacultyModuleStatus }) {
  const map: Record<
    FacultyModuleStatus,
    { color: "success" | "warning" | "info"; label: string }
  > = {
    published: { color: "success", label: "Published" },
    draft: { color: "warning", label: "Draft" },
    "under-review": { color: "info", label: "Under review" },
  };
  const { color, label } = map[status];
  return (
    <Badge color={color} variant="light">
      {label}
    </Badge>
  );
}

function relativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return `${Math.round(days / 30)} months ago`;
}
