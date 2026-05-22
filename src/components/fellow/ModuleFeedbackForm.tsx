"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { CheckCircleIcon } from "@/icons";
import type { ModuleFeedback } from "@/lib/api/fellow-learning";

type Props = {
  /** Real backend module id. Form is hidden when null (mock-only). */
  moduleId: string;
  /** Already-submitted feedback for read-only display. Null = show form. */
  existing: ModuleFeedback | null;
};

const RATING_FIELDS: {
  key: "overallRating" | "contentRating" | "sessionRating" | "mentorRating";
  label: string;
  hint: string;
}[] = [
  {
    key: "overallRating",
    label: "Overall",
    hint: "How would you rate this module overall?",
  },
  {
    key: "contentRating",
    label: "Content",
    hint: "Lessons, readings, and exercises.",
  },
  {
    key: "sessionRating",
    label: "Live sessions",
    hint: "Host clarity, pacing, engagement.",
  },
  {
    key: "mentorRating",
    label: "Facilitator support",
    hint: "Responsiveness and quality of feedback.",
  },
];

/**
 * End-of-module feedback (BRD §6.10 extension). One submission per fellow
 * per module. Stored anonymously from admin/faculty perspective — they
 * see aggregate ratings + comments but never `fellowId`.
 *
 * Required to unlock the next module. Backend's curriculum service won't
 * flip `unlocked: true` on the next week until a row exists here, so the
 * card shows even when the fellow has already passed/attended this one.
 */
export default function ModuleFeedbackForm({ moduleId, existing }: Props) {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, number>>({
    overallRating: 0,
    contentRating: 0,
    sessionRating: 0,
    mentorRating: 0,
  });
  const [whatWorked, setWhatWorked] = useState("");
  const [whatDidnt, setWhatDidnt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<ModuleFeedback | null>(existing);

  if (submitted) {
    return (
      <ReadOnlyFeedback feedback={submitted} />
    );
  }

  const allRatingsSet = RATING_FIELDS.every((f) => ratings[f.key] > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!allRatingsSet || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiFetch<{ feedback: ModuleFeedback }>(
        `/modules/${encodeURIComponent(moduleId)}/feedback`,
        {
          method: "POST",
          body: {
            overallRating: ratings.overallRating,
            contentRating: ratings.contentRating,
            sessionRating: ratings.sessionRating,
            mentorRating: ratings.mentorRating,
            whatWorked: whatWorked.trim() || undefined,
            whatDidnt: whatDidnt.trim() || undefined,
          },
        },
      );
      setSubmitted(res.feedback);
      toast.success(
        "Feedback submitted",
        "Thanks — the next module is now unlocked.",
      );
      // Refresh server data so the curriculum cascade picks up the unlock.
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't submit feedback", err);
    }
    setSubmitting(false);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-warning-200 bg-warning-50 p-5 md:p-6"
    >
      <div className="mb-5">
        <h3 className="text-base font-semibold text-gray-800">
          Module feedback
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Required to unlock the next week. Your responses are anonymous —
          admins and faculty see ratings and comments without your name.
        </p>
      </div>

      <div className="space-y-5">
        {RATING_FIELDS.map((f) => (
          <RatingRow
            key={f.key}
            label={f.label}
            hint={f.hint}
            value={ratings[f.key]}
            onChange={(v) =>
              setRatings((prev) => ({ ...prev, [f.key]: v }))
            }
          />
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            What worked well? <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            rows={3}
            maxLength={1000}
            value={whatWorked}
            onChange={(e) => setWhatWorked(e.target.value)}
            placeholder="What helped you learn the most?"
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-fellowship-navy focus:outline-none focus:ring-1 focus:ring-fellowship-navy"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            What didn&apos;t? <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            rows={3}
            maxLength={1000}
            value={whatDidnt}
            onChange={(e) => setWhatDidnt(e.target.value)}
            placeholder="Where did you get stuck or want more support?"
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-fellowship-navy focus:outline-none focus:ring-1 focus:ring-fellowship-navy"
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {allRatingsSet
            ? "Ready to submit."
            : "Rate every category to enable submit."}
        </p>
        <Button
          type="submit"
          size="sm"
          variant="fellowship"
          disabled={!allRatingsSet || submitting}
          className="bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
        >
          {submitting ? "Submitting…" : "Submit feedback"}
        </Button>
      </div>
    </form>
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
                active
                  ? "bg-fellowship-navy text-white"
                  : "text-gray-600 hover:bg-gray-50"
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

function ReadOnlyFeedback({ feedback }: { feedback: ModuleFeedback }) {
  return (
    <div className="rounded-2xl border border-success-200 bg-success-50 p-5 md:p-6">
      <div className="flex items-start gap-3">
        <CheckCircleIcon className="h-6 w-6 text-success-600" />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-800">
            Feedback submitted
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Thanks for your input — this is what unlocked the next module.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
            {[
              { label: "Overall", value: feedback.overallRating },
              { label: "Content", value: feedback.contentRating },
              { label: "Sessions", value: feedback.sessionRating },
              { label: "Facilitator", value: feedback.mentorRating },
            ].map((r) => (
              <div key={r.label}>
                <dt className="text-xs text-gray-500">{r.label}</dt>
                <dd className="font-semibold text-gray-800">{r.value} / 5</dd>
              </div>
            ))}
          </dl>
          {(feedback.whatWorked || feedback.whatDidnt) && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {feedback.whatWorked && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    What worked
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {feedback.whatWorked}
                  </p>
                </div>
              )}
              {feedback.whatDidnt && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    What didn&apos;t
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {feedback.whatDidnt}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
