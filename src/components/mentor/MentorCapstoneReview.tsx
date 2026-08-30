"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { ScheduleSessionModal } from "@/components/mentor/MentorRequestsView";
import Button from "@/components/ui/button/Button";
import { DownloadIcon, PaperPlaneIcon } from "@/icons";
import { toast } from "@/lib/toast";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import {
  reviewCapstone,
  type CapstoneFeedbackEntry,
  type CapstoneStatus,
  type FellowCapstone,
  type ReviewOutcome,
} from "@/lib/api/fellow-capstone";

import {
  capstoneFilenameBase,
  downloadCapstoneDocx,
} from "@/lib/capstone/exportCapstoneDocx";

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
  fellowId,
}: {
  capstone: FellowCapstone;
  /** Real backend Capstone.id when available — enables persisting reviews. */
  backendCapstoneId?: string | null;
  fellowName: string;
  fellowEmail: string;
  fellowCountry: string;
  /** Enables scheduling a session with this fellow from the review page. */
  fellowId?: string;
}) {
  const user = useCurrentUser();
  const router = useRouter();
  const [status, setStatus] = useState<CapstoneStatus>(capstone.status);
  const [feedback, setFeedback] = useState(capstone.feedback);
  const [reply, setReply] = useState("");
  const [outcome, setOutcome] = useState<ReviewOutcome>("comments");
  const [postingReview, setPostingReview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  /**
   * Download the fellow's capstone as a Word (.docx) file — the same content
   * shown on this page (problem statement + the full draft body), so the mentor
   * can read or annotate it offline regardless of what format the fellow
   * originally uploaded. Shares the fellow's export builder.
   */
  const onDownloadWord = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await downloadCapstoneDocx({
        title: capstone.title,
        subtitle: `${capstone.sector} · ${fellowName} · exported ${new Date().toLocaleDateString(undefined, { timeZone: "Africa/Lagos" })}`,
        sections: [
          { label: "Problem statement", text: capstone.draft.problem },
          { label: "Draft", text: capstone.draft.approach },
        ],
        filename: `${capstoneFilenameBase(`${fellowName}_${capstone.title}`)}_Capstone.docx`,
      });
      toast.success("Downloaded", "A Word copy has been saved to your device.");
    } catch (err) {
      toast.errorFromException("Couldn't download", err);
    } finally {
      setExporting(false);
    }
  };

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

      {draftEmpty ? (
        <EmptyDraftCard />
      ) : (
        <>
          <div className="flex flex-wrap justify-end gap-2">
            {/* Booking a session with this fellow is a natural next step while
                reading their capstone — previously it meant leaving for the
                coaching-requests page and finding them in a list. */}
            {fellowId && (
              <Button
                size="sm"
                variant="fellowship"
                onClick={() => setScheduleOpen(true)}
              >
                + Schedule session
              </Button>
            )}
            {/* The fellow's own uploaded file. Parsing it into the boxes is
                additive — the original is kept in storage — but the mentor had
                no way to reach it, so they only ever saw the extracted text
                (which loses the fellow's formatting, tables, and figures). */}
            {capstone.artifactUrl && (
              <a
                href={capstone.artifactUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <DownloadIcon className="h-4 w-4" />
                Original upload
              </a>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onDownloadWord}
              disabled={exporting}
            >
              {exporting ? "Preparing…" : "Download as Word"}
            </Button>
          </div>
          <TitleCard
            title={capstone.title}
            oneliner={capstone.oneliner}
            sector={capstone.sector}
          />
          <ReadOnlySection
            label="Problem statement"
            value={capstone.draft.problem}
          />
          {/* Approach / Deliverables / Risks are stored as one combined
              markdown blob server-side and arrive on the `approach`
              field. Render once as the full draft body. */}
          <ReadOnlySection label="Draft" value={capstone.draft.approach} />
        </>
      )}

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

      {fellowId && (
        <ScheduleSessionModal
          isOpen={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          fellows={[{ id: fellowId, fullName: fellowName }]}
          initialFellowIds={[fellowId]}
          onScheduled={() => {
            toast.success(
              "Session scheduled",
              "An admin will confirm and create the Zoom meeting shortly.",
            );
            setScheduleOpen(false);
            router.refresh();
          }}
        />
      )}
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
          <p className="mt-2 line-clamp-2 text-sm text-gray-600">{oneliner}</p>
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
        {/* Posting is blocked without a comment, and a greyed-out button with
            no explanation reads as a broken page — mentors were selecting
            "Approve stage" and finding nothing happened. Say what's needed. */}
        {!reply.trim() && (
          <p className="mt-1 text-xs font-medium text-amber-600">
            Add a comment before posting — the fellow sees it as your feedback,
            and it&apos;s recorded against this stage.
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <fieldset className="flex flex-wrap gap-2">
            {(
              [
                { value: "comments", label: "Comments only" },
                { value: "needs_revision", label: "Needs revision" },
                {
                  value: "approved",
                  label: "Approve capstone",
                },
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
            // A disabled button with no explanation reads as broken. Say why.
            title={
              !reply.trim()
                ? "Write a comment first — every review is recorded with your feedback to the fellow."
                : undefined
            }
          >
            <PaperPlaneIcon className="h-4 w-4" />
            {posting ? "Posting…" : "Post review"}
          </Button>
        </div>
        {outcome === "needs_revision" && !reply.trim() && (
          <p className="mt-2 text-xs text-error-600">
            Add feedback before sending this back — the fellow needs to know
            what to change.
          </p>
        )}
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
