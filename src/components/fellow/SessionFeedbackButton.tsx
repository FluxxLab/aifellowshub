"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { CheckLineIcon } from "@/icons";

type Props = {
  sessionId: string;
  sessionTitle: string;
  /** Whether the fellow has already given feedback for this session. */
  submitted: boolean;
};

const RATING_FIELDS: {
  key: "overallRating" | "contentRating" | "sessionRating" | "mentorRating";
  label: string;
  hint: string;
}[] = [
  { key: "overallRating", label: "Overall", hint: "How was this session overall?" },
  { key: "contentRating", label: "Content", hint: "Material and exercises covered." },
  { key: "sessionRating", label: "Delivery", hint: "Host clarity, pacing, engagement." },
  { key: "mentorRating", label: "Support", hint: "Help and responsiveness during the session." },
];

/**
 * Per-session feedback (one response per attended session). Renders a compact
 * "Give feedback" button that opens a rating modal; once submitted it shows a
 * non-interactive "Feedback submitted" state. Posts to
 * /api/sessions/:id/feedback → backend /me/sessions/:id/feedback.
 */
export default function SessionFeedbackButton({
  sessionId,
  sessionTitle,
  submitted,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(submitted);
  const [ratings, setRatings] = useState<Record<string, number>>({
    overallRating: 0,
    contentRating: 0,
    sessionRating: 0,
    mentorRating: 0,
  });
  const [whatWorked, setWhatWorked] = useState("");
  const [whatDidnt, setWhatDidnt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600">
        <CheckLineIcon className="h-3.5 w-3.5" />
        Feedback submitted
      </span>
    );
  }

  const allRatingsSet = RATING_FIELDS.every((f) => ratings[f.key] > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!allRatingsSet || submitting) return;
    setSubmitting(true);
    try {
      await apiFetch(`/sessions/${encodeURIComponent(sessionId)}/feedback`, {
        method: "POST",
        body: {
          overallRating: ratings.overallRating,
          contentRating: ratings.contentRating,
          sessionRating: ratings.sessionRating,
          mentorRating: ratings.mentorRating,
          whatWorked: whatWorked.trim() || undefined,
          whatDidnt: whatDidnt.trim() || undefined,
        },
      });
      setDone(true);
      setOpen(false);
      toast.success("Feedback submitted", "Thanks for your input.");
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't submit feedback", err);
    }
    setSubmitting(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-sm font-medium text-fellowship-navy hover:text-fellowship-navy-dark"
      >
        Give feedback
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} className="m-4 max-w-lg">
        <form onSubmit={submit} className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-900">
            Session feedback
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {sessionTitle} · your responses are anonymous to faculty.
          </p>

          <div className="mt-5 space-y-5">
            {RATING_FIELDS.map((f) => (
              <RatingRow
                key={f.key}
                label={f.label}
                hint={f.hint}
                value={ratings[f.key]}
                onChange={(v) => setRatings((p) => ({ ...p, [f.key]: v }))}
              />
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                What worked well? <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={2}
                maxLength={1000}
                value={whatWorked}
                onChange={(e) => setWhatWorked(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-fellowship-navy focus:outline-none focus:ring-1 focus:ring-fellowship-navy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                What didn&apos;t? <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={2}
                maxLength={1000}
                value={whatDidnt}
                onChange={(e) => setWhatDidnt(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-fellowship-navy focus:outline-none focus:ring-1 focus:ring-fellowship-navy"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="fellowship"
              disabled={!allRatingsSet || submitting}
            >
              {submitting ? "Submitting…" : "Submit feedback"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function RatingRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{hint}</p>
      </div>
      <div
        role="radiogroup"
        aria-label={label}
        className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(n)}
              className={`min-w-[2.25rem] rounded-md px-2.5 py-1.5 text-sm font-semibold transition-colors ${
                active ? "bg-fellowship-navy text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
