"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import AvatarText from "@/components/ui/avatar/AvatarText";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";

type HostCandidate = {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "super_admin" | "faculty";
  isActive: boolean;
};

type ParticipantsResponse = {
  admins: { id: string; fullName: string; email: string; role: "admin" | "super_admin"; isActive: boolean }[];
  faculty: { id: string; fullName: string; email: string; isActive: boolean }[];
};

/**
 * Pick a different admin / faculty user as the session host. Reassign
 * deletes the original Zoom meeting and creates a fresh one under the
 * new host's email — they need a Zoom seat in the workspace.
 */
export default function ReassignHostModal({
  isOpen,
  onClose,
  sessionId,
  sessionTitle,
  currentHostId,
}: {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle: string;
  currentHostId: string;
}) {
  const router = useRouter();
  const [candidates, setCandidates] = useState<HostCandidate[] | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setError(null);
    setCandidates(null);
    (async () => {
      try {
        const data = await apiFetch<ParticipantsResponse>("/admin/participants");
        if (cancelled) return;
        const list: HostCandidate[] = [
          ...data.admins
            .filter((u) => u.isActive)
            .map((u) => ({ ...u, role: u.role })),
          ...data.faculty
            .filter((u) => u.isActive)
            .map((u) => ({ ...u, role: "faculty" as const })),
        ].sort((a, b) => a.fullName.localeCompare(b.fullName));
        setCandidates(list);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Couldn't load hosts.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  async function pick(host: HostCandidate) {
    if (host.id === currentHostId) {
      onClose();
      return;
    }
    setSubmitting(host.id);
    try {
      await apiFetch(
        `/sessions/${encodeURIComponent(sessionId)}/reassign-host`,
        { method: "POST", body: { hostId: host.id } },
      );
      toast.success(
        "Host reassigned",
        `${host.fullName} is now hosting this session.`,
      );
      router.refresh();
      onClose();
    } catch (err) {
      toast.errorFromException("Couldn't reassign host", err);
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-lg p-6 sm:p-8">
      <h2 className="text-title-sm font-bold text-gray-800">
        Reassign host
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Pick a new host for{" "}
        <span className="font-semibold text-gray-700">{sessionTitle}</span>.
        The new host needs a Zoom seat — we recreate the meeting under
        their account.
      </p>

      {error && (
        <div className="mt-5 rounded-md border border-error-200 bg-error-50 p-3 text-sm text-error-700">
          {error}
        </div>
      )}

      {!candidates && !error && (
        <p className="mt-5 text-sm text-gray-500">Loading hosts…</p>
      )}

      {candidates && candidates.length === 0 && (
        <div className="mt-5 rounded-md border border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
          No active admins or faculty to reassign to.
        </div>
      )}

      {candidates && candidates.length > 0 && (
        <ul className="mt-5 max-h-[60vh] divide-y divide-gray-100 overflow-y-auto">
          {candidates.map((c) => {
            const isCurrent = c.id === currentHostId;
            return (
              <li key={c.id} className="flex items-center gap-3 py-3">
                <AvatarText name={c.fullName} className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-800">
                    {c.fullName}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {c.email} ·{" "}
                    {c.role === "super_admin"
                      ? "Super admin"
                      : c.role === "admin"
                        ? "Admin"
                        : "Faculty"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={isCurrent ? "outline" : "fellowship"}
                  disabled={isCurrent || submitting !== null}
                  onClick={() => pick(c)}
                  className={
                    isCurrent
                      ? ""
                      : "bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
                  }
                >
                  {isCurrent
                    ? "Current"
                    : submitting === c.id
                      ? "Reassigning…"
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
