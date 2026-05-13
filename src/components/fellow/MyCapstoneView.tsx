"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { toast } from "@/lib/toast";
import { CheckLineIcon, PaperPlaneIcon } from "@/icons";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import {
  postFellowCapstoneComment,
  saveFellowCapstone,
  submitFellowCapstone,
  type CapstoneFeedbackEntry,
  type CapstoneMilestone,
  type CapstoneStatus,
  type FellowCapstone,
} from "@/lib/api/fellow-capstone";

/**
 * Fellow capstone view (BRD §6.10).
 *
 * Phase 1 (UI-first): the draft form is editable client-side; "Save draft"
 * just bumps a local lastSaved timestamp.
 * Phase 2: PATCH /capstone/me on save, POST /capstone/me/submit on submit,
 * POST /capstone/me/feedback on a thread reply.
 */
export default function MyCapstoneView({
  capstone,
}: {
  capstone: FellowCapstone;
}) {
  const user = useCurrentUser();
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [title, setTitle] = useState(capstone.title);
  const [draft, setDraft] = useState(capstone.draft);
  const [lastSaved, setLastSaved] = useState(capstone.draft.lastSavedAt);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">("idle");
  const [submitState, setSubmitState] = useState<"idle" | "submitting">("idle");
  const [status, setStatus] = useState<CapstoneStatus>(capstone.status);
  const [feedback, setFeedback] = useState(capstone.feedback);
  const [reply, setReply] = useState("");

  const wordCount = countWords([
    draft.problem,
    draft.approach,
    draft.deliverables,
    draft.risks,
  ].join(" "));

  const onSaveDraft = async () => {
    if (savingState === "saving") return;
    setSavingState("saving");
    try {
      const saved = await saveFellowCapstone({
        title: title.trim() || capstone.title,
        problemStatement: draft.problem,
        // Backend stores everything except the problem statement as one
        // markdown blob in `content` for now. Concat the structured fields
        // so the mentor sees the full draft.
        content: [
          draft.approach && `## Approach\n${draft.approach}`,
          draft.deliverables && `## Deliverables\n${draft.deliverables}`,
          draft.risks && `## Risks & limitations\n${draft.risks}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
        sector: capstone.sector,
      });
      setLastSaved(saved.updatedAt);
      setStatus(saved.status);
      setSavingState("saved");
      window.setTimeout(() => setSavingState("idle"), 1800);
    } catch (err) {
      setSavingState("idle");
      toast.errorFromException("Couldn't save", err);
    }
  };

  const onSubmit = async () => {
    if (submitState === "submitting") return;
    if (draft.problem.trim().length < 10) {
      toast.error(
        "Add a problem statement",
        "Mentors need at least a brief framing before reviewing.",
      );
      return;
    }
    const ok = await confirm({
      title: "Submit for mentor review?",
      message:
        "Your mentor will receive the current draft. You can keep editing once they reply.",
      confirmLabel: "Submit",
    });
    if (!ok) return;
    setSubmitState("submitting");
    try {
      // Save first so the latest draft is what the mentor sees.
      await saveFellowCapstone({
        title: title.trim() || capstone.title,
        problemStatement: draft.problem,
        content: [
          draft.approach && `## Approach\n${draft.approach}`,
          draft.deliverables && `## Deliverables\n${draft.deliverables}`,
          draft.risks && `## Risks & limitations\n${draft.risks}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
        sector: capstone.sector,
      });
      const submitted = await submitFellowCapstone();
      setStatus(submitted.status);
      setLastSaved(submitted.updatedAt);
      toast.success(
        "Submitted",
        "Your mentor has the latest draft. Status will update once they review.",
      );
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't submit", err);
    }
    setSubmitState("idle");
  };

  const onPostReply = async () => {
    const trimmed = reply.trim();
    if (!trimmed) return;
    // Optimistically render the message so the thread feels instant.
    // The id has an "opt-" prefix so router.refresh() below can replace
    // it with the persisted row's real id without leaving a duplicate.
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: CapstoneFeedbackEntry = {
      id: optimisticId,
      fromMentor: false,
      fromName: user.fullName,
      message: trimmed,
      at: new Date().toISOString(),
    };
    setFeedback((prev) => [...prev, optimistic]);
    setReply("");
    try {
      await postFellowCapstoneComment(trimmed);
      // Pull the server's authoritative feedback list so the mentor's
      // notification timestamp and the row id reconcile.
      router.refresh();
    } catch (err) {
      // Roll back the optimistic insert and surface the error so the
      // fellow knows their comment didn't actually post.
      setFeedback((prev) => prev.filter((f) => f.id !== optimisticId));
      setReply(trimmed);
      toast.errorFromException("Couldn't post your comment", err);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Capstone" },
        ]}
      />
      <div data-tour="capstone-heading">
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          My capstone
        </h1>
        <p className="mt-2 max-w-3xl text-gray-600">
          Your capstone is the artefact you ship by Week 12 — a brief, audit,
          framework, or policy proposal someone outside the Fellowship can pick
          up and use. Mentor: <span className="font-semibold text-gray-800">{capstone.mentor.fullName}</span>.
        </p>
      </div>

      <div data-tour="capstone-status">
        <StatusBanner
          status={status}
          lastSavedAt={lastSaved}
          wordCount={wordCount}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
          <TitleCard
            title={title}
            onTitleChange={setTitle}
            oneliner={capstone.oneliner}
            sector={capstone.sector}
          />

          <DraftSection
            label="Problem statement"
            description="What is the harm or governance gap, and why does it matter?"
            value={draft.problem}
            onChange={(v) => setDraft({ ...draft, problem: v })}
          />

          <DraftSection
            label="Approach"
            description="How will you address it? Method, framework, deliverable type."
            value={draft.approach}
            onChange={(v) => setDraft({ ...draft, approach: v })}
          />

          <DraftSection
            label="Deliverables"
            description="Concrete artefacts — what will exist by Week 12?"
            value={draft.deliverables}
            onChange={(v) => setDraft({ ...draft, deliverables: v })}
          />

          <DraftSection
            label="Risks & limitations"
            description="What could go wrong, and what's out of scope."
            value={draft.risks}
            onChange={(v) => setDraft({ ...draft, risks: v })}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Ready to hand off to {capstone.mentor.fullName.split(" ")[0]}?
              </p>
              <p className="text-xs text-gray-500">
                Submission opens Week 10 — you can keep saving drafts until then.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="md"
                variant="outline"
                onClick={onSaveDraft}
                disabled={savingState === "saving" || submitState === "submitting"}
              >
                {savingState === "saving"
                  ? "Saving…"
                  : savingState === "saved"
                  ? "Saved ✓"
                  : "Save draft"}
              </Button>
              <Button
                size="md"
                variant="fellowship"
                onClick={onSubmit}
                disabled={
                  submitState === "submitting" ||
                  status === "under-review" ||
                  status === "approved"
                }
              >
                {submitState === "submitting"
                  ? "Submitting…"
                  : status === "under-review"
                  ? "Under review"
                  : status === "approved"
                  ? "Approved"
                  : "Submit for review"}
              </Button>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4 md:gap-6">
          <MentorCard
            mentor={capstone.mentor}
            onSendMessage={() => {
              const el = document.getElementById("capstone-feedback-thread");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <MilestonesCard milestones={capstone.milestones} />
        </aside>
      </div>

      <FeedbackThread
        feedback={feedback}
        userName={user.fullName}
        reply={reply}
        onReplyChange={setReply}
        onPostReply={onPostReply}
        mentorName={capstone.mentor.fullName}
      />
      {dialog}
    </div>
  );
}

function StatusBanner({
  status,
  lastSavedAt,
  wordCount,
}: {
  status: CapstoneStatus;
  lastSavedAt: string;
  wordCount: number;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <StatusBadge status={status} />
        <span className="text-gray-300">·</span>
        <span className="text-sm text-gray-600">
          Last saved <RelativeTime iso={lastSavedAt} />
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-sm text-gray-600">{wordCount} words</span>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: CapstoneStatus }) {
  const map: Record<CapstoneStatus, { color: "info" | "warning" | "success" | "error" | "light"; label: string }> = {
    "not-started": { color: "light", label: "Not started" },
    draft: { color: "warning", label: "Draft" },
    submitted: { color: "info", label: "Submitted" },
    "under-review": { color: "info", label: "Under review" },
    approved: { color: "success", label: "Approved" },
    returned: { color: "error", label: "Returned for revision" },
  };
  const { color, label } = map[status];
  return <Badge color={color}>{label}</Badge>;
}

function TitleCard({
  title,
  onTitleChange,
  oneliner,
  sector,
}: {
  title: string;
  onTitleChange: (next: string) => void;
  oneliner: string;
  sector: string;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Capstone title
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="What is your capstone called?"
              className="mt-1 w-full bg-transparent text-xl font-semibold text-gray-800 outline-none focus:ring-0"
            />
          </label>
          <p className="mt-2 text-sm text-gray-600">{oneliner}</p>
        </div>
        <Badge color="info" variant="light">
          {sector}
        </Badge>
      </div>
    </section>
  );
}

function DraftSection({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <textarea
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm leading-relaxed text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
      />
    </section>
  );
}

function MentorCard({
  mentor,
  onSendMessage,
}: {
  mentor: FellowCapstone["mentor"];
  onSendMessage: () => void;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Your mentor
      </p>
      <div className="mt-3 flex items-center gap-3">
        <AvatarText name={mentor.fullName} className="h-10 w-10" />
        <div>
          <p className="text-sm font-semibold text-gray-800">{mentor.fullName}</p>
          <p className="text-xs text-gray-500">{mentor.email}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        {mentor.expertiseSummary}
      </p>
      <div className="mt-4">
        <Button size="sm" variant="outline" onClick={onSendMessage} className="w-full">
          <PaperPlaneIcon className="h-4 w-4" />
          Reply on the thread
        </Button>
      </div>
    </section>
  );
}

function MilestonesCard({ milestones }: { milestones: CapstoneMilestone[] }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Milestones
      </p>
      <ol className="mt-3 space-y-3">
        {milestones.map((m) => (
          <li key={m.id} className="flex items-start gap-3 text-sm">
            <MilestoneOrb status={m.status} />
            <div className="flex-1">
              <p
                className={`font-medium ${
                  m.status === "complete"
                    ? "text-gray-500 line-through"
                    : m.status === "overdue"
                    ? "text-error-700"
                    : "text-gray-800"
                }`}
              >
                {m.title}
              </p>
              <p className="text-xs text-gray-500">
                Week {m.weekNumber} ·{" "}
                {new Date(m.dueAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MilestoneOrb({ status }: { status: CapstoneMilestone["status"] }) {
  if (status === "complete") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-600">
        <CheckLineIcon className="h-3 w-3" />
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-fellowship-navy bg-white" />
    );
  }
  if (status === "overdue") {
    return (
      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-error-500 bg-error-50" />
    );
  }
  return <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-gray-200 bg-white" />;
}

function FeedbackThread({
  feedback,
  userName,
  reply,
  onReplyChange,
  onPostReply,
  mentorName,
}: {
  feedback: CapstoneFeedbackEntry[];
  userName: string;
  reply: string;
  onReplyChange: (v: string) => void;
  onPostReply: () => void;
  mentorName: string;
}) {
  return (
    <section
      id="capstone-feedback-thread"
      className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Mentor feedback thread
        </h2>
        <span className="text-xs text-gray-500">
          {feedback.length} {feedback.length === 1 ? "message" : "messages"}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {feedback.map((f) => (
          <FeedbackBubble key={f.id} entry={f} />
        ))}
      </div>

      <div className="mt-6 border-t border-gray-100 pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          Reply as {userName}
        </p>
        <textarea
          rows={3}
          value={reply}
          onChange={(e) => onReplyChange(e.target.value)}
          placeholder={`Reply to ${mentorName}…`}
          className="w-full resize-y rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
        />
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            variant="fellowship"
            onClick={onPostReply}
            disabled={!reply.trim()}
          >
            <PaperPlaneIcon className="h-4 w-4" />
            Post reply
          </Button>
        </div>
      </div>
    </section>
  );
}

function FeedbackBubble({ entry }: { entry: CapstoneFeedbackEntry }) {
  return (
    <div className="flex items-start gap-3">
      <AvatarText name={entry.fromName} className="h-9 w-9" />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-gray-800">{entry.fromName}</p>
          {entry.fromMentor && (
            <Badge color="info" variant="light">
              Mentor
            </Badge>
          )}
          <span className="text-xs text-gray-500">
            <RelativeTime iso={entry.at} />
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {entry.message}
        </p>
      </div>
    </div>
  );
}

function RelativeTime({ iso }: { iso: string }) {
  const ago = relativeTime(iso);
  return <span>{ago}</span>;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  const months = Math.round(days / 30);
  return `${months} ${months === 1 ? "month" : "months"} ago`;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
