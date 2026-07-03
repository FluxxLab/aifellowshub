"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { apiFetch } from "@/lib/api/client";
import { sectorLabel } from "@/lib/sector";
import { toast } from "@/lib/toast";
import {
  assignFellowsToMentor,
  getMentorFellows,
  type MentorAvailableFellow,
} from "@/lib/api/mentor-fellows";

/**
 * Pin one or more fellows to a mentor. Fetches the mentor's available
 * fellows on open (everyone not already under their care), then bulk-assigns
 * the selected ones via `mentorOverrideId`. Reused by the mentor profile
 * section and the mentors-list row action.
 */
export default function AssignFellowsModal({
  isOpen,
  onClose,
  mentorId,
  mentorName,
  onAssigned,
}: {
  isOpen: boolean;
  onClose: () => void;
  mentorId: string;
  mentorName: string;
  onAssigned?: () => void;
}) {
  const [available, setAvailable] = useState<MentorAvailableFellow[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setAvailable(null);
    setLoadError(false);
    try {
      const data = await getMentorFellows(mentorId);
      setAvailable(data.available);
    } catch {
      setLoadError(true);
    }
  }, [mentorId]);

  // (Re)load the candidate list each time the modal opens; reset selection.
  useEffect(() => {
    if (!isOpen) return;
    setSelected(new Set());
    setSearch("");
    void load();
  }, [isOpen, load]);

  const visible = useMemo(() => {
    if (!available) return [];
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      (f) =>
        f.fullName.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q),
    );
  }, [available, search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      const { assigned } = await assignFellowsToMentor(
        mentorId,
        Array.from(selected),
      );
      toast.success(
        "Fellows assigned",
        `${assigned} fellow${assigned === 1 ? "" : "s"} now assigned to ${mentorName}.`,
      );
      onAssigned?.();
      onClose();
    } catch (err) {
      toast.errorFromException("Couldn't assign fellows", err);
    }
    setSubmitting(false);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800">Assign fellows</h3>
      <p className="mt-1 text-sm text-gray-500">
        Pin fellows to{" "}
        <span className="font-semibold text-gray-700">{mentorName}</span>. Pinned
        fellows take priority over sector auto-matching.
      </p>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search fellows…"
        className="mt-4 h-10 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-none focus:ring-3 focus:ring-fellowship-navy/10"
      />

      <div className="mt-4 max-h-[50vh] overflow-y-auto rounded-lg border border-gray-100">
        {available === null && !loadError && (
          <p className="px-4 py-8 text-center text-sm text-gray-400">Loading…</p>
        )}
        {loadError && (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Couldn’t load fellows.{" "}
            <button
              type="button"
              onClick={() => void load()}
              className="font-semibold text-fellowship-navy hover:underline"
            >
              Retry
            </button>
          </div>
        )}
        {available !== null && !loadError && visible.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            {available.length === 0
              ? "Every fellow is already under this mentor’s care."
              : "No fellows match your search."}
          </p>
        )}
        {visible.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {visible.map((f) => {
              const checked = selected.has(f.id);
              return (
                <li key={f.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(f.id)}
                      className="h-4 w-4 rounded border-gray-300 text-fellowship-navy focus:ring-fellowship-navy"
                    />
                    <AvatarText name={f.fullName} className="h-9 w-9" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {f.fullName}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {f.email}
                        {f.sector ? ` · ${sectorLabel(f.sector)}` : ""}
                      </p>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          {selected.size} selected
        </p>
        <div className="flex gap-3 sm:justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="fellowship"
            disabled={selected.size === 0 || submitting}
            onClick={() => void submit()}
            className="bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
          >
            {submitting
              ? "Assigning…"
              : `Assign ${selected.size || ""}`.trim()}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
