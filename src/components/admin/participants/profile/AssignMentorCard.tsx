"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import type { AssignedMentor } from "@/lib/api/participants";
import type { MentorSummary } from "@/lib/api/mentorship";

/**
 * Admin-side mentor card on the fellow profile. Shows the currently
 * resolved mentor (override if set, otherwise the sector-matched one)
 * and lets admin pin or clear an override via a modal picker.
 */
export default function AssignMentorCard({
  fellowId,
  fellowSector,
  assignedMentor,
  hasOverride,
  mentors,
}: {
  fellowId: string;
  fellowSector: string | null;
  assignedMentor: AssignedMentor | null;
  hasOverride: boolean;
  mentors: MentorSummary[];
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function pickMentor(mentor: MentorSummary) {
    if (mentor.id === assignedMentor?.id && hasOverride) {
      setOpen(false);
      return;
    }
    setSubmitting(mentor.id);
    try {
      await apiFetch(
        `/admin/fellows/${encodeURIComponent(fellowId)}/mentor`,
        { method: "PATCH", body: { mentorId: mentor.id } },
      );
      toast.success("Mentor assigned", `${mentor.fullName} is now this fellow's mentor.`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't assign mentor", err);
    }
    setSubmitting(null);
  }

  async function clearOverride() {
    const ok = await confirm({
      title: "Clear mentor override?",
      message:
        "This fellow will fall back to the sector-matched mentor (or no mentor if none exists for their sector).",
      confirmLabel: "Clear override",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await apiFetch(
        `/admin/fellows/${encodeURIComponent(fellowId)}/mentor`,
        { method: "PATCH", body: { mentorId: null } },
      );
      toast.success("Override cleared");
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't clear override", err);
    }
  }

  const sortedMentors = [...mentors].sort((a, b) => {
    // Prioritise mentors whose sector matches the fellow's.
    const aMatch = a.sector === fellowSector ? 0 : 1;
    const bMatch = b.sector === fellowSector ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return a.fullName.localeCompare(b.fullName);
  });

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      {dialog}
      <header className="mb-4">
        <h2 className="text-base font-semibold text-gray-800">Mentor</h2>
      </header>

      {assignedMentor ? (
        <div>
          <div className="flex items-center gap-3">
            <AvatarText name={assignedMentor.fullName} className="h-11 w-11" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-800">
                {assignedMentor.fullName}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {hasOverride ? "Pinned by admin" : "Auto-matched by sector"}
              </p>
            </div>
            {hasOverride && <Badge color="primary" size="sm">Override</Badge>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="text-xs font-semibold text-fellowship-navy hover:text-fellowship-navy-dark"
            >
              Reassign
            </button>
            {hasOverride && (
              <button
                type="button"
                onClick={clearOverride}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Clear override
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-center">
          <p className="text-sm text-gray-500">No mentor assigned yet.</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-2 text-sm font-semibold text-fellowship-navy hover:text-fellowship-navy-dark"
          >
            Assign a mentor
          </button>
        </div>
      )}

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        className="max-w-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800">Assign a mentor</h3>
        <p className="mt-1 text-sm text-gray-500">
          {fellowSector
            ? `Mentors in the "${fellowSector.replace(/_/g, " ")}" sector are listed first.`
            : "This fellow has no sector set. Pin any mentor below."}
        </p>

        {sortedMentors.length === 0 ? (
          <div className="mt-5 rounded-md border border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
            No active mentors to choose from. Invite a mentor first.
          </div>
        ) : (
          <ul className="mt-5 max-h-[60vh] divide-y divide-gray-100 overflow-y-auto">
            {sortedMentors.map((m) => {
              const isCurrent =
                assignedMentor?.id === m.id && hasOverride;
              const isSectorMatch = m.sector === fellowSector;
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 py-3"
                >
                  <AvatarText name={m.fullName} className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {m.fullName}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {m.sector
                        ? m.sector.replace(/_/g, " ")
                        : "No sector"}
                    </p>
                  </div>
                  {isSectorMatch && (
                    <Badge color="success" size="sm">
                      Sector match
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant={isCurrent ? "outline" : "fellowship"}
                    disabled={isCurrent || submitting !== null}
                    onClick={() => pickMentor(m)}
                    className={
                      isCurrent
                        ? ""
                        : "bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
                    }
                  >
                    {isCurrent
                      ? "Current"
                      : submitting === m.id
                        ? "Assigning…"
                        : "Assign"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </section>
  );
}
