"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBookingSlot } from "@/lib/datetime";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { CalenderIcon, ChevronRightIcon, TimeIcon } from "@/icons";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import type { AdminBooking, BookingStatus } from "@/lib/api/mentorship";

// Admin queue: defaults to "Awaiting admin" since that's the only
// actionable state. Other statuses are visible for context.
const STATUS_FILTERS: { id: "all" | BookingStatus; label: string }[] = [
  { id: "pending_admin", label: "Awaiting admin" },
  { id: "pending_mentor", label: "Awaiting mentor" },
  { id: "confirmed", label: "Confirmed" },
  { id: "declined", label: "Declined" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
];

const STATUS_COPY: Record<
  BookingStatus,
  { label: string; color: "info" | "success" | "warning" | "error" | "primary" }
> = {
  pending_mentor: { label: "Awaiting mentor", color: "info" },
  pending_admin: { label: "Awaiting admin", color: "warning" },
  confirmed: { label: "Confirmed", color: "success" },
  declined: { label: "Mentor declined", color: "error" },
  cancelled: { label: "Cancelled", color: "info" },
  completed: { label: "Completed", color: "primary" },
};

export default function AdminBookingsView({
  initialBookings,
}: {
  initialBookings: AdminBooking[];
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [bookings, setBookings] = useState(initialBookings);
  // Default to the actionable queue — admins coming to this page are
  // there to approve mentor-accepted requests.
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]["id"]>(
    "pending_admin",
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return bookings;
    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  async function deletePast(b: AdminBooking) {
    const ok = await confirm({
      title: "Delete this past session?",
      message:
        "Removes the record from the fellow's and mentor's lists. Use this to tidy up coaching requests whose date has passed. This can't be undone.",
      confirmLabel: "Delete",
      tone: "danger",
    });
    if (!ok) return;
    setBusyId(b.id);
    try {
      await apiFetch(
        `/me/mentor/bookings/${encodeURIComponent(b.id)}`,
        { method: "DELETE" },
      );
      setBookings((prev) => prev.filter((x) => x.id !== b.id));
      toast.success(
        "Session deleted",
        "Cleared from the fellow's and mentor's coaching lists.",
      );
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't delete session", err);
    }
    setBusyId(null);
  }

  async function approve(b: AdminBooking) {
    const ok = await confirm({
      title: "Approve this booking?",
      message:
        "A Zoom meeting will be created under your email. You'll host the call.",
      confirmLabel: "Approve & host",
    });
    if (!ok) return;
    setBusyId(b.id);
    try {
      const res = await apiFetch<{ booking: AdminBooking }>(
        `/admin/mentorship-bookings/${encodeURIComponent(b.id)}/approve`,
        { method: "POST" },
      );
      setBookings((prev) => prev.map((x) => (x.id === b.id ? res.booking : x)));
      toast.success(
        "Booking confirmed",
        "Fellow and mentor will see the Zoom link on their pages.",
      );
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't approve booking", err);
    }
    setBusyId(null);
  }

  // Admin can't decline — that's the mentor's call. If a booking
  // shouldn't go ahead, the mentor declines or the fellow cancels.

  return (
    <div className="flex flex-col gap-4">
      {dialog}
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
          <p className="text-sm text-gray-500">No bookings in this view.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((b) => {
            const start = new Date(b.requestedStartsAt);
            const s = STATUS_COPY[b.status];
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
                      {formatBookingSlot(start)}
                    </div>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                      <TimeIcon className="h-3.5 w-3.5" />
                      {b.requestedDurationMinutes} min
                    </p>
                    <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                      <div className="flex gap-2">
                        <dt className="text-gray-500">Fellow</dt>
                        <dd className="font-medium text-gray-800">
                          {b.fellow?.fullName ?? "—"}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-gray-500">Mentor</dt>
                        <dd className="font-medium text-gray-800">
                          {b.mentor?.fullName ?? "—"}
                        </dd>
                      </div>
                    </dl>
                    {b.topic && (
                      <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Agenda
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
                          className="inline-flex items-center gap-1.5 rounded-lg bg-fellowship-navy px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-fellowship-navy-dark"
                        >
                          Open Zoom meeting
                          <ChevronRightIcon className="h-4 w-4" />
                        </a>
                        {b.approvedBy && (
                          <span className="ml-2 text-gray-500">
                            (host: {b.approvedBy.fullName})
                          </span>
                        )}
                      </p>
                    )}
                    {b.status === "declined" && b.mentorDeclineReason && (
                      <p className="mt-3 text-xs text-error-700">
                        Mentor declined: {b.mentorDeclineReason}
                      </p>
                    )}
                  </div>
                  <Badge color={s.color} variant="light">
                    {s.label}
                  </Badge>
                </div>

                {b.status === "pending_admin" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="fellowship"
                      onClick={() => approve(b)}
                      disabled={isBusy}
                      className="bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
                    >
                      {isBusy ? "Working…" : "Approve & host"}
                    </Button>
                  </div>
                )}

                {start.getTime() < Date.now() && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => deletePast(b)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1.5 rounded-md border border-error-200 bg-white px-3 py-1.5 text-xs font-semibold text-error-600 transition-colors hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-60"
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
