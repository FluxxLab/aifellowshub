"use client";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { sectorLabel } from "@/lib/sector";
import { toast } from "@/lib/toast";
import {
  getMentorFellows,
  unassignFellowFromMentor,
  type MentorAssignedFellow,
} from "@/lib/api/mentor-fellows";
import AssignFellowsModal from "./AssignFellowsModal";

/**
 * "Assigned fellows" section on a mentor's profile page. Lists the fellows
 * under this mentor's care — pinned (explicit override) or matched by sector
 * — and lets an admin pin more fellows or unpin a pinned one. Sector-matched
 * fellows aren't directly removable here (they'd just re-match); reassign
 * them to another mentor instead.
 */
export default function MentorFellowsSection({
  mentorId,
  mentorName,
}: {
  mentorId: string;
  mentorName: string;
}) {
  const { confirm, dialog } = useConfirm();
  const [assigned, setAssigned] = useState<MentorAssignedFellow[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const data = await getMentorFellows(mentorId);
      setAssigned(data.assigned);
    } catch {
      setLoadError(true);
    }
  }, [mentorId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function unpin(f: MentorAssignedFellow) {
    const ok = await confirm({
      title: "Unassign this fellow?",
      message: `${f.fullName} will revert to sector auto-matching. You can reassign them at any time.`,
      confirmLabel: "Unassign",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(f.id);
    try {
      await unassignFellowFromMentor(mentorId, f.id);
      toast.success("Fellow unassigned");
      await load();
    } catch (err) {
      toast.errorFromException("Couldn't unassign fellow", err);
    }
    setBusyId(null);
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      {dialog}
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-800">
            Assigned fellows
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            {assigned === null
              ? " "
              : `${assigned.length} under ${mentorName}’s care`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAssignOpen(true)}
          className="shrink-0 rounded-full bg-fellowship-navy px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-fellowship-navy-dark"
        >
          + Assign fellows
        </button>
      </header>

      {assigned === null && !loadError && (
        <p className="py-6 text-center text-sm text-gray-400">Loading…</p>
      )}
      {loadError && (
        <div className="py-6 text-center text-sm text-gray-500">
          Couldn’t load assigned fellows.{" "}
          <button
            type="button"
            onClick={() => void load()}
            className="font-semibold text-fellowship-navy hover:underline"
          >
            Retry
          </button>
        </div>
      )}
      {assigned !== null && !loadError && assigned.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center">
          <p className="text-sm text-gray-500">No fellows assigned yet.</p>
          <button
            type="button"
            onClick={() => setAssignOpen(true)}
            className="mt-2 text-sm font-semibold text-fellowship-navy hover:text-fellowship-navy-dark"
          >
            Assign fellows
          </button>
        </div>
      )}
      {assigned !== null && assigned.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {assigned.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-3">
              <AvatarText name={f.fullName} className="h-10 w-10" />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/participants/${f.id}`}
                  className="block truncate text-sm font-semibold text-gray-800 hover:text-fellowship-navy"
                >
                  {f.fullName}
                </Link>
                <p className="truncate text-xs text-gray-500">
                  {f.sector ? sectorLabel(f.sector) : "No sector"}
                </p>
              </div>
              {f.via === "pinned" ? (
                <Badge color="primary" size="sm">
                  Pinned
                </Badge>
              ) : (
                <Badge color="light" size="sm">
                  Sector
                </Badge>
              )}
              {f.via === "pinned" && (
                <button
                  type="button"
                  onClick={() => void unpin(f)}
                  disabled={busyId === f.id}
                  aria-label={`Unassign ${f.fullName}`}
                  title="Unassign (revert to sector match)"
                  className="rounded-md px-2 py-1 text-xs font-semibold text-error-600 transition-colors hover:bg-error-50 disabled:opacity-50"
                >
                  {busyId === f.id ? "…" : "Unassign"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <AssignFellowsModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        mentorId={mentorId}
        mentorName={mentorName}
        onAssigned={() => void load()}
      />
    </section>
  );
}
