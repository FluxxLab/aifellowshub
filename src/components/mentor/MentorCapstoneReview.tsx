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
  PaperPlaneIcon,
} from "@/icons";
import { toast } from "@/lib/toast";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import {
  reviewCapstone,
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
              <ReadOnlySection
                label="Problem statement"
                value={capstone.draft.problem}
              />
              {/* Approach / Deliverables / Risks are stored as one
                  combined markdown blob server-side and arrive on the
                  `approach` field. Render once as the full draft body
                  rather than three near-empty Read-only cards. */}
              <ReadOnlySection
                label="Draft"
                value={capstone.draft.approach}
              />
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
        </aside>
      </div>

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
