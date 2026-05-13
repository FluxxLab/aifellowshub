"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { CalenderIcon, TimeIcon } from "@/icons";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type { BookingStatus, MentorBooking } from "@/lib/api/mentorship";

const STATUS_FILTERS: { id: "all" | BookingStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending_mentor", label: "Awaiting your response" },
  { id: "pending_admin", label: "Awaiting admin" },
  { id: "confirmed", label: "Confirmed" },
  { id: "declined", label: "Declined" },
  { id: "cancelled", label: "Cancelled" },
];

const STATUS_COPY: Record<
  BookingStatus,
  { label: string; tone: "info" | "success" | "warning" | "error" | "primary" }
> = {
  pending_mentor: { label: "Needs your response", tone: "warning" },
  pending_admin: { label: "Awaiting admin", tone: "info" },
  confirmed: { label: "Confirmed", tone: "success" },
  declined: { label: "Declined", tone: "error" },
  cancelled: { label: "Cancelled", tone: "info" },
  completed: { label: "Completed", tone: "primary" },
};

/**
 * Mentor's coaching-request inbox. Replaces the old availability-slot
 * publishing page. Three actions: accept, decline (with optional reason),
 * or no-op for rows that aren't waiting on the mentor.
 */
export default function MentorRequestsView({
  initialBookings,
}: {
  initialBookings: MentorBooking[];
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [bookings, setBookings] = useState(initialBookings);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]["id"]>(
    "pending_mentor",
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const subset =
      filter === "all"
        ? bookings
        : bookings.filter((b) => b.status === filter);
    // Chronological order so the mentor can scan the schedule top-to-
    // bottom: future requests first (soonest first), then past ones
    // (most recent first). Sessions with no start date — there
    // shouldn't be any, but guarding — go to the bottom.
    const now = Date.now();
    return [...subset].sort((a, b) => {
      const aT = +new Date(a.requestedStartsAt);
      const bT = +new Date(b.requestedStartsAt);
      const aFuture = aT >= now;
      const bFuture = bT >= now;
      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;
      // Both future: ascending (soonest first).
      // Both past:  descending (most recent first).
      return aFuture ? aT - bT : bT - aT;
    });
  }, [bookings, filter]);

  async function accept(b: MentorBooking) {
    const ok = await confirm({
      title: "Accept this request?",
      message:
        "An admin will confirm and create the Zoom meeting. You'll get the join link once it's live.",
      confirmLabel: "Accept",
    });
    if (!ok) return;
    setBusyId(b.id);
    try {
      await apiFetch(
        `/me/mentor/bookings/${encodeURIComponent(b.id)}/accept`,
        { method: "POST" },
      );
      setBookings((prev) =>
        prev.map((x) =>
          x.id === b.id ? { ...x, status: "pending_admin" } : x,
        ),
      );
      toast.success("Request accepted", "An admin will confirm shortly.");
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't accept", err);
    }
    setBusyId(null);
  }

  async function decline(b: MentorBooking) {
    const reason = window.prompt("Reason (optional)") ?? "";
    setBusyId(b.id);
    try {
      await apiFetch(
        `/me/mentor/bookings/${encodeURIComponent(b.id)}/decline`,
        { method: "POST", body: { reason } },
      );
      setBookings((prev) =>
        prev.map((x) =>
          x.id === b.id
            ? {
                ...x,
                status: "declined",
                mentorDeclineReason: reason || null,
              }
            : x,
        ),
      );
      toast.success("Request declined");
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't decline", err);
    }
    setBusyId(null);
  }

  async function deletePast(b: MentorBooking) {
    const ok = await confirm({
      title: "Delete this past session?",
      message:
        "Removes it from your list. The fellow's record of the session is preserved.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(b.id);
    try {
      await apiFetch(`/me/mentor/bookings/${encodeURIComponent(b.id)}`, {
        method: "DELETE",
      });
      setBookings((prev) => prev.filter((x) => x.id !== b.id));
      toast.success("Past session deleted");
    } catch (err) {
      toast.errorFromException("Couldn't delete", err);
    }
    setBusyId(null);
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {dialog}
      <Breadcrumbs
        items={[{ label: "Home", href: "/mentor" }, { label: "Coaching requests" }]}
      />
      <div>
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          Coaching requests
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Review the proposed time from your fellows. Accept if it fits
          your schedule, or decline with a comment.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === f.id
                ? "bg-fellowship-navy text-white"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            {filter === "pending_mentor"
              ? "No requests waiting on you. Nice."
              : "No bookings in this view."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((b) => {
            const start = new Date(b.requestedStartsAt);
            const meta = STATUS_COPY[b.status];
            const isBusy = busyId === b.id;
            return (
              <li
                key={b.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <CalenderIcon className="h-4 w-4" />
                      {start.toLocaleString(undefined, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                      <TimeIcon className="h-3.5 w-3.5" />
                      {b.requestedDurationMinutes} min
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      from{" "}
                      <span className="font-semibold text-gray-800">
                        {b.fellow?.fullName ?? "Fellow"}
                      </span>
                    </p>
                    {b.topic && (
                      <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Their agenda
                        </p>
                        <p className="mt-1">{b.topic}</p>
                      </div>
                    )}
                    {b.status === "confirmed" && b.zoomJoinUrl && (
                      <p className="mt-3 text-xs">
                        <a
                          href={b.zoomJoinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-fellowship-navy hover:underline"
                        >
                          Open Zoom meeting →
                        </a>
                      </p>
                    )}
                    {b.status === "declined" && b.mentorDeclineReason && (
                      <p className="mt-3 text-xs text-error-700">
                        Your reason: {b.mentorDeclineReason}
                      </p>
                    )}
                  </div>
                  <Badge color={meta.tone} variant="light">
                    {meta.label}
                  </Badge>
                </div>

                {b.status === "pending_mentor" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="fellowship"
                      onClick={() => accept(b)}
                      disabled={isBusy}
                      className="bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
                    >
                      {isBusy ? "Working…" : "Accept"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decline(b)}
                      disabled={isBusy}
                    >
                      Decline
                    </Button>
                  </div>
                )}

                {start.getTime() < Date.now() && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => deletePast(b)}
                      disabled={isBusy}
                      className="text-xs font-medium text-gray-400 hover:text-error-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy ? "Deleting…" : "Delete past session"}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
