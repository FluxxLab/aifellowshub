"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import {
  CalenderIcon,
  CheckLineIcon,
  CloseLineIcon,
  PaperPlaneIcon,
} from "@/icons";
import { toast } from "@/lib/toast";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import {
  reviewCapstone,
  type CapstoneAssignment,
  type CapstoneFeedbackEntry,
  type CapstoneStatus,
  type FellowCapstone,
  type ReviewOutcome,
} from "@/lib/api/fellow-capstone";

/**
 * Mentor's view of a fellow's capstone (BRD §6.10).
 *
 * Phase 1 (UI-first): all controls update local state.
 * Phase 2: PATCH /capstone/:fellowId/status (approve/return),
 * POST /capstone/:fellowId/feedback, etc.
 */
export default function MentorCapstoneReview({
  capstone,
  backendCapstoneId,
  fellowName,
  fellowEmail,
  fellowCountry,
}: {
  capstone: FellowCapstone;
  /** Real backend Capstone.id when available — enables persisting reviews. */
  backendCapstoneId?: string | null;
  fellowName: string;
  fellowEmail: string;
  fellowCountry: string;
}) {
  const user = useCurrentUser();
  const router = useRouter();
  const [status, setStatus] = useState<CapstoneStatus>(capstone.status);
  const [feedback, setFeedback] = useState(capstone.feedback);
  const [reply, setReply] = useState("");
  const [outcome, setOutcome] = useState<ReviewOutcome>("comments");
  const [postingReview, setPostingReview] = useState(false);
  const [assignments, setAssignments] = useState(capstone.assignments);

  const addAssignment = (title: string, description: string, dueAt: string | null) => {
    // Phase 2: POST /capstone/:fellowId/assignments
    setAssignments((prev) => [
      ...prev,
      {
        id: `asg-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        assignedBy: { id: user.id, name: user.fullName },
        assignedAt: new Date().toISOString(),
        dueAt,
        status: "pending",
        completedAt: null,
      },
    ]);
  };

  const removeAssignment = (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  };
  const [decisionState, setDecisionState] = useState<"idle" | "saved">("idle");

  const onPostReply = async () => {
    const trimmed = reply.trim();
    if (trimmed.length < 2 || postingReview) return;
    // Optimistic: append the bubble immediately.
    const optimisticId = `f-${Date.now()}`;
    setFeedback((prev) => [
      ...prev,
      {
        id: optimisticId,
        fromMentor: true,
        fromName: user.fullName,
        message: trimmed,
        at: new Date().toISOString(),
      },
    ]);
    setReply("");

    if (!backendCapstoneId) {
      // Mock-only path — UI was already updated.
      return;
    }
    setPostingReview(true);
    try {
      const updated = await reviewCapstone(backendCapstoneId, {
        outcome,
        message: trimmed,
      });
      setStatus(updated.status);
      // Refresh server data so feedback list + status are authoritative.
      router.refresh();
    } catch (err) {
      // Roll back the optimistic bubble.
      setFeedback((prev) => prev.filter((f) => f.id !== optimisticId));
      setReply(trimmed);
      toast.errorFromException("Couldn't post review", err);
    }
    setPostingReview(false);
    setOutcome("comments");
  };

  const setDecision = (next: CapstoneStatus) => {
    // Phase 2: PATCH /capstone/:fellowId/status.
    setStatus(next);
    setDecisionState("saved");
    window.setTimeout(() => setDecisionState("idle"), 1800);
  };

  const draftEmpty = capstone.draft.problem === "—";
  const draftWords = countWords(
    [
      capstone.draft.problem,
      capstone.draft.approach,
      capstone.draft.stakeholders,
      capstone.draft.deliverables,
      capstone.draft.risks,
    ].join(" ")
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Mentor home", href: "/mentor" },
          { label: "Queue", href: "/mentor/queue" },
          { label: fellowName },
        ]}
      />

      <FellowHeader
        fellowName={fellowName}
        fellowEmail={fellowEmail}
        fellowCountry={fellowCountry}
        sector={capstone.sector}
        status={status}
        wordCount={draftWords}
        lastSavedAt={capstone.draft.lastSavedAt}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
          {draftEmpty ? (
            <EmptyDraftCard />
          ) : (
            <>
              <TitleCard
                title={capstone.title}
                oneliner={capstone.oneliner}
                sector={capstone.sector}
              />
              <ReadOnlySection label="Problem statement" value={capstone.draft.problem} />
              <ReadOnlySection label="Approach" value={capstone.draft.approach} />
              <ReadOnlySection label="Stakeholders" value={capstone.draft.stakeholders} />
              <ReadOnlySection label="Deliverables" value={capstone.draft.deliverables} />
              <ReadOnlySection label="Risks & limitations" value={capstone.draft.risks} />
            </>
          )}
        </div>

        <aside className="flex flex-col gap-4 md:gap-6">
          <DecisionCard
            status={status}
            onApprove={() => setDecision("approved")}
            onReturn={() => setDecision("returned")}
            onMarkUnderReview={() => setDecision("under-review")}
            decisionState={decisionState}
            disabled={draftEmpty}
          />

          <ConsultationsCard consultations={capstone.consultations} />
        </aside>
      </div>

      <MentorAssignmentsPanel
        assignments={assignments}
        onAdd={addAssignment}
        onRemove={removeAssignment}
        fellowName={fellowName}
      />

      <FeedbackThread
        feedback={feedback}
        userName={user.fullName}
        reply={reply}
        onReplyChange={setReply}
        onPostReply={onPostReply}
        fellowName={fellowName}
        outcome={outcome}
        onOutcomeChange={setOutcome}
        posting={postingReview}
      />
    </div>
  );
}

function MentorAssignmentsPanel({
  assignments,
  onAdd,
  onRemove,
  fellowName,
}: {
  assignments: CapstoneAssignment[];
  onAdd: (title: string, description: string, dueAt: string | null) => void;
  onRemove: (id: string) => void;
  fellowName: string;
}) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");

  const canAssign = title.trim().length >= 6 && description.trim().length >= 10;

  const submit = () => {
    if (!canAssign) return;
    onAdd(title, description, dueAt ? new Date(dueAt).toISOString() : null);
    setTitle("");
    setDescription("");
    setDueAt("");
    setComposerOpen(false);
  };

  const pending = assignments.filter((a) => a.status === "pending");
  const completed = assignments.filter((a) => a.status === "completed");

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Assignments for {fellowName.split(" ")[0]}
          </h2>
          <p className="text-xs text-gray-500">
            {pending.length} pending · {completed.length} completed
          </p>
        </div>
        <Button
          size="sm"
          variant="fellowship"
          onClick={() => setComposerOpen((o) => !o)}
        >
          <PaperPlaneIcon className="h-4 w-4" />
          {composerOpen ? "Cancel" : "Assign new"}
        </Button>
      </div>

      {composerOpen && (
        <div className="mt-4 rounded-lg border border-fellowship-navy/30 bg-gray-50 p-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cite NDPA articles in problem statement"
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What needs to happen, and what does done look like?"
                className="mt-1 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
              />
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Due (optional)
              </label>
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Title ≥ 6 chars · Description ≥ 10 chars
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setComposerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="fellowship"
              onClick={submit}
              disabled={!canAssign}
            >
              Assign
            </Button>
          </div>
        </div>
      )}

      {assignments.length === 0 && !composerOpen ? (
        <p className="mt-4 text-sm text-gray-500">
          No assignments yet. Use this to give {fellowName.split(" ")[0]}{" "}
          concrete tasks between 1:1s.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {[...pending, ...completed].map((a) => (
            <MentorAssignmentRow
              key={a.id}
              assignment={a}
              onRemove={() => onRemove(a.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function MentorAssignmentRow({
  assignment: a,
  onRemove,
}: {
  assignment: CapstoneAssignment;
  onRemove: () => void;
}) {
  const isCompleted = a.status === "completed";
  const overdue = useMemo(
    // eslint-disable-next-line react-hooks/purity -- transient visual cue
    () => !isCompleted && a.dueAt && +new Date(a.dueAt) < Date.now(),
    [isCompleted, a.dueAt],
  );

  return (
    <li
      className={`rounded-lg border p-4 ${
        isCompleted
          ? "border-success-100 bg-success-50/40"
          : overdue
          ? "border-error-200 bg-error-50/30"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            isCompleted
              ? "bg-success-500 text-white"
              : "border-2 border-gray-300 bg-white"
          }`}
          aria-hidden
        >
          {isCompleted && <CheckLineIcon className="h-3.5 w-3.5" />}
        </span>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <p
              className={`text-sm font-semibold ${
                isCompleted ? "text-gray-500 line-through" : "text-gray-800"
              }`}
            >
              {a.title}
            </p>
            {!isCompleted && (
              <button
                type="button"
                onClick={onRemove}
                className="text-xs font-medium text-gray-400 hover:text-error-600"
              >
                Remove
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600">{a.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {a.dueAt && (
              <span
                className={
                  overdue ? "font-semibold text-error-600" : undefined
                }
              >
                {overdue ? "Overdue · " : "Due "}
                {new Date(a.dueAt).toLocaleDateString(undefined, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
            {a.dueAt && <span className="text-gray-300">·</span>}
            <span>Assigned {relativeTime(a.assignedAt)}</span>
            {isCompleted && a.completedAt && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-success-700">
                  Completed {relativeTime(a.completedAt)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function FellowHeader({
  fellowName,
  fellowEmail,
  fellowCountry,
  sector,
  status,
  wordCount,
  lastSavedAt,
}: {
  fellowName: string;
  fellowEmail: string;
  fellowCountry: string;
  sector: string;
  status: CapstoneStatus;
  wordCount: number;
  lastSavedAt: string;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <AvatarText name={fellowName} className="h-12 w-12 text-base" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{fellowName}</h1>
            <p className="text-sm text-gray-500">
              {fellowEmail} · {fellowCountry} · {sector}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={status} />
          <span className="text-xs text-gray-500">
            {wordCount} words · last saved {relativeTime(lastSavedAt)}
          </span>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: CapstoneStatus }) {
  const map: Record<
    CapstoneStatus,
    { color: "info" | "warning" | "success" | "error" | "light"; label: string }
  > = {
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
  oneliner,
  sector,
}: {
  title: string;
  oneliner: string;
  sector: string;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Capstone title
          </p>
          <h2 className="mt-1 text-xl font-semibold text-gray-800">{title}</h2>
          <p className="mt-2 text-sm text-gray-600">{oneliner}</p>
        </div>
        <Badge color="info" variant="light">
          {sector}
        </Badge>
      </div>
    </section>
  );
}

function ReadOnlySection({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
        {value}
      </p>
    </section>
  );
}

function EmptyDraftCard() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center md:p-12">
      <h2 className="text-lg font-semibold text-gray-700">
        No draft to review yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
        This fellow hasn&apos;t saved a capstone draft. The thread below is the
        right place to nudge them — or open it with a scoping prompt.
      </p>
    </section>
  );
}

function DecisionCard({
  status,
  onApprove,
  onReturn,
  onMarkUnderReview,
  decisionState,
  disabled,
}: {
  status: CapstoneStatus;
  onApprove: () => void;
  onReturn: () => void;
  onMarkUnderReview: () => void;
  decisionState: "idle" | "saved";
  disabled: boolean;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Mentor decision
      </p>
      <p className="mt-1 text-sm text-gray-600">
        Approve sends the capstone to graduation eligibility. Return sends it
        back to the fellow with your last comment as the reason.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {status === "submitted" && (
          <Button
            size="sm"
            variant="outline"
            onClick={onMarkUnderReview}
            disabled={disabled}
            className="w-full"
          >
            Start review
          </Button>
        )}
        <Button
          size="sm"
          variant="fellowship"
          onClick={onApprove}
          disabled={disabled || status === "approved"}
          className="w-full"
        >
          <CheckLineIcon className="h-4 w-4" />
          {status === "approved" ? "Approved ✓" : "Approve"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReturn}
          disabled={disabled || status === "not-started"}
          className="w-full"
        >
          <CloseLineIcon className="h-4 w-4" />
          {status === "returned" ? "Returned ✓" : "Return for revision"}
        </Button>
      </div>

      {decisionState === "saved" && (
        <p className="mt-3 text-xs text-success-700">
          Decision saved. The fellow will see this on their capstone page.
        </p>
      )}
    </section>
  );
}

function ConsultationsCard({
  consultations,
}: {
  consultations: FellowCapstone["consultations"];
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Stakeholder consultations
      </p>
      {consultations.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">
          None logged yet — at least one is required (Week 10).
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {consultations.map((c) => {
            const when = new Date(c.scheduledAt);
            return (
              <li
                key={c.id}
                className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm"
              >
                <p className="font-medium text-gray-800">{c.stakeholderName}</p>
                <p className="text-xs text-gray-500">{c.stakeholderRole}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500">
                  <CalenderIcon className="h-3.5 w-3.5" />
                  {when.toLocaleDateString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  ·{" "}
                  {when.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function FeedbackThread({
  feedback,
  userName,
  reply,
  onReplyChange,
  onPostReply,
  fellowName,
  outcome,
  onOutcomeChange,
  posting,
}: {
  feedback: CapstoneFeedbackEntry[];
  userName: string;
  reply: string;
  onReplyChange: (v: string) => void;
  onPostReply: () => void;
  fellowName: string;
  outcome: ReviewOutcome;
  onOutcomeChange: (next: ReviewOutcome) => void;
  posting: boolean;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Feedback thread</h2>
        <span className="text-xs text-gray-500">
          {feedback.length} {feedback.length === 1 ? "message" : "messages"}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {feedback.length === 0 ? (
          <p className="text-sm text-gray-500">
            No messages yet. Open the thread with a scoping prompt or a
            critique on the draft.
          </p>
        ) : (
          feedback.map((f) => <FeedbackBubble key={f.id} entry={f} />)
        )}
      </div>

      <div className="mt-6 border-t border-gray-100 pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          Reply as {userName} (mentor)
        </p>
        <textarea
          rows={3}
          value={reply}
          onChange={(e) => onReplyChange(e.target.value)}
          placeholder={`Reply to ${fellowName}…`}
          className="w-full resize-y rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <fieldset className="flex flex-wrap gap-2">
            {(
              [
                { value: "comments", label: "Comments only" },
                { value: "needs_revision", label: "Needs revision" },
                { value: "approved", label: "Approve stage" },
              ] as { value: ReviewOutcome; label: string }[]
            ).map((opt) => {
              const selected = outcome === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? "border-fellowship-navy bg-fellowship-navy text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-fellowship-navy"
                  }`}
                >
                  <input
                    type="radio"
                    name="review-outcome"
                    className="sr-only"
                    value={opt.value}
                    checked={selected}
                    onChange={() => onOutcomeChange(opt.value)}
                  />
                  {opt.label}
                </label>
              );
            })}
          </fieldset>
          <Button
            size="sm"
            variant="fellowship"
            onClick={onPostReply}
            disabled={!reply.trim() || posting}
          >
            <PaperPlaneIcon className="h-4 w-4" />
            {posting ? "Posting…" : "Post review"}
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
          <span className="text-xs text-gray-500">{relativeTime(entry.at)}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {entry.message}
        </p>
      </div>
    </div>
  );
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
