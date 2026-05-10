"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Spinner from "@/components/ui/loader/Spinner";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";

type MentorCandidate = {
  id: string;
  fullName: string;
  email: string;
  bio: string | null;
  sector: string | null;
};

/**
 * Pin a supervisor mentor to a capstone. Uses POST
 * /capstones/:id/assign-mentor — the existing backend endpoint that
 * sets Capstone.mentorId. Sector-matched mentors are listed first.
 */
export default function AssignCapstoneMentorModal({
  isOpen,
  onClose,
  capstoneId,
  fellowName,
  fellowSector,
  currentMentorId,
}: {
  isOpen: boolean;
  onClose: () => void;
  capstoneId: string;
  fellowName: string;
  fellowSector: string | null;
  currentMentorId: string | null;
}) {
  const router = useRouter();
  const [mentors, setMentors] = useState<MentorCandidate[] | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setError(null);
    setMentors(null);
    (async () => {
      try {
        const data = await apiFetch<{ mentors: MentorCandidate[] }>("/mentors");
        if (cancelled) return;
        setMentors(data.mentors ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Couldn't load mentors.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  async function pick(mentor: MentorCandidate) {
    if (mentor.id === currentMentorId) {
      onClose();
      return;
    }
    setSubmitting(mentor.id);
    try {
      await apiFetch(
        `/capstones/${encodeURIComponent(capstoneId)}/assign-mentor`,
        { method: "POST", body: { mentorId: mentor.id } },
      );
      toast.success(
        "Supervisor assigned",
        `${mentor.fullName} is reviewing this capstone.`,
      );
      router.refresh();
      onClose();
    } catch (err) {
      toast.errorFromException("Couldn't assign supervisor", err);
    } finally {
      setSubmitting(null);
    }
  }

  const sortedMentors = mentors
    ? [...mentors].sort((a, b) => {
        // Sector matches first, then alphabetical.
        const aMatch = a.sector === fellowSector ? 0 : 1;
        const bMatch = b.sector === fellowSector ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
        return a.fullName.localeCompare(b.fullName);
      })
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-lg p-6 sm:p-8">
      <h2 className="text-title-sm font-bold text-gray-800">
        {currentMentorId ? "Reassign supervisor" : "Assign supervisor"}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Pick a mentor to supervise{" "}
        <span className="font-semibold text-gray-700">{fellowName}</span>
        &apos;s capstone.{" "}
        {fellowSector
          ? `Mentors in the "${fellowSector.replace(/_/g, " ")}" sector are listed first.`
          : null}
      </p>

      {error && (
        <div className="mt-5 rounded-md border border-error-200 bg-error-50 p-3 text-sm text-error-700">
          {error}
        </div>
      )}

      {!sortedMentors && !error && (
        <div className="mt-5 flex items-center gap-2 text-sm text-gray-500">
          <Spinner size="sm" label="Loading mentors…" />
          <span aria-hidden>Loading mentors…</span>
        </div>
      )}

      {sortedMentors && sortedMentors.length === 0 && (
        <div className="mt-5 rounded-md border border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
          No mentors available. Invite one first.
        </div>
      )}

      {sortedMentors && sortedMentors.length > 0 && (
        <ul className="mt-5 max-h-[60vh] divide-y divide-gray-100 overflow-y-auto">
          {sortedMentors.map((m) => {
            const isCurrent = m.id === currentMentorId;
            const isSectorMatch = m.sector === fellowSector;
            return (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <AvatarText name={m.fullName} className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {m.fullName}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {m.sector ? m.sector.replace(/_/g, " ") : "No sector"}
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
                  onClick={() => pick(m)}
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

      <div className="mt-6 flex justify-end">
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
