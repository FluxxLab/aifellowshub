"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";

type Decision = "approved" | "needs_revision";

/**
 * Admin approves or rejects a fellow's capstone.
 *
 * Posts to the same `POST /capstones/:id/review` endpoint the mentor uses
 * rather than a separate admin-only status write. That endpoint already lets
 * admins through, and going via it keeps the side effects that make a decision
 * real: the feedback row the fellow reads, the notification, and the
 * certificate cascade on approval. A direct status update would change the
 * chip in this table and silently skip all three.
 *
 * The note is required because it is the only thing the fellow is shown — a
 * rejection with no reason gives them nothing to act on.
 */
export default function CapstoneDecisionModal({
  isOpen,
  onClose,
  capstoneId,
  fellowName,
  currentStatus,
}: {
  isOpen: boolean;
  onClose: () => void;
  capstoneId: string;
  fellowName: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision>("approved");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset between openings — otherwise the previous fellow's note and decision
  // carry over into the next row the admin opens.
  useEffect(() => {
    if (isOpen) {
      setDecision("approved");
      setNote("");
      setSubmitting(false);
    }
  }, [isOpen]);

  const trimmed = note.trim();
  const canSubmit = trimmed.length >= 2 && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await apiFetch(`/capstones/${encodeURIComponent(capstoneId)}/review`, {
        method: "POST",
        body: { outcome: decision, message: trimmed },
      });
      toast.success(
        decision === "approved" ? "Capstone approved" : "Revision requested",
        decision === "approved"
          ? `${fellowName}'s capstone is approved. They've been notified.`
          : `${fellowName} has been asked to revise, and can see your note.`,
      );
      router.refresh();
      onClose();
    } catch (err) {
      toast.errorFromException("Couldn't update the capstone", err);
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Capstone decision
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {fellowName} · currently{" "}
        <span className="font-medium text-gray-700">{currentStatus}</span>
      </p>

      <div className="mt-5 flex flex-col gap-2">
        <DecisionOption
          checked={decision === "approved"}
          onSelect={() => setDecision("approved")}
          label="Approve"
          hint="Marks the capstone approved and counts it toward their certificate."
        />
        <DecisionOption
          checked={decision === "needs_revision"}
          onSelect={() => setDecision("needs_revision")}
          label="Reject — request revision"
          hint="Sends it back so the fellow can revise and resubmit."
        />
      </div>

      <label className="mt-5 block text-sm font-medium text-gray-700">
        Note to the fellow
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder={
            decision === "approved"
              ? "e.g. Strong analysis and a clear recommendation. Approved."
              : "e.g. Please expand the methodology section and resubmit."
          }
          className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none focus:border-fellowship-navy"
        />
      </label>
      <p className="mt-1 text-xs text-gray-500">
        {trimmed.length < 2
          ? "Required — this is what the fellow sees in their feedback thread."
          : "The fellow sees this in their feedback thread."}
      </p>

      <div className="mt-6 flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="fellowship"
          onClick={submit}
          disabled={!canSubmit}
        >
          {submitting
            ? "Saving…"
            : decision === "approved"
              ? "Approve capstone"
              : "Request revision"}
        </Button>
      </div>
    </Modal>
  );
}

function DecisionOption({
  checked,
  onSelect,
  label,
  hint,
}: {
  checked: boolean;
  onSelect: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-lg border px-4 py-3 text-left transition-colors ${
        checked
          ? "border-fellowship-navy bg-fellowship-navy/5"
          : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <span className="flex items-center gap-2">
        <span
          className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
            checked ? "border-fellowship-navy" : "border-gray-300"
          }`}
        >
          {checked && (
            <span className="h-2 w-2 rounded-full bg-fellowship-navy" />
          )}
        </span>
        <span className="text-sm font-semibold text-gray-800">{label}</span>
      </span>
      <span className="mt-1 block pl-6 text-xs text-gray-500">{hint}</span>
    </button>
  );
}
