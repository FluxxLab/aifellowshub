"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { CalenderIcon, TimeIcon } from "@/icons";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import type { BookingStatus, FellowBooking } from "@/lib/api/mentorship";

type Props = {
  initialBookings: FellowBooking[];
};

const STATUS_COPY: Record<BookingStatus, { label: string; color: "info" | "success" | "warning" | "error" | "primary"; hint: string }> = {
  pending_mentor: {
    label: "Awaiting mentor",
    color: "warning",
    hint: "Your mentor will accept or decline soon.",
  },
  pending_admin: {
    label: "Awaiting admin",
    color: "warning",
    hint: "Mentor accepted — admin is confirming and creating the meeting.",
  },
  confirmed: {
    label: "Confirmed",
    color: "success",
    hint: "Use the join link below at the start time.",
  },
  declined: {
    label: "Declined",
    color: "error",
    hint: "Mentor wasn't available for that time.",
  },
  cancelled: {
    label: "Cancelled",
    color: "info",
    hint: "This booking was cancelled.",
  },
  completed: {
    label: "Completed",
    color: "primary",
    hint: "This session has ended.",
  },
};

export default function FellowBookingsList({ initialBookings }: Props) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [bookings, setBookings] = useState(initialBookings);

  async function cancel(b: FellowBooking) {
    const ok = await confirm({
      title: "Cancel this booking?",
      message: "The slot will reopen for someone else to book.",
      confirmLabel: "Cancel booking",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await apiFetch(`/me/bookings/${encodeURIComponent(b.id)}/cancel`, {
        method: "POST",
      });
      setBookings((prev) =>
        prev.map((x) =>
          x.id === b.id
            ? { ...x, status: "cancelled", cancelledAt: new Date().toISOString() }
            : x,
        ),
      );
      toast.success("Booking cancelled");
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't cancel", err);
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">
          You haven&apos;t booked any mentorship sessions yet.
        </p>
      </div>
    );
  }

  return (
    <>
      {dialog}
      <ul className="flex flex-col gap-3">
        {bookings.map((b) => {
        const s = STATUS_COPY[b.status];
        const start = new Date(b.requestedStartsAt);
        return (
          <li
            key={b.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
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
                  with{" "}
                  <span className="font-semibold text-gray-800">
                    {b.mentor?.fullName ?? "Mentor"}
                  </span>
                </p>
              </div>
              <Badge color={s.color} variant="light">
                {s.label}
              </Badge>
            </div>

            <p className="mt-3 text-xs text-gray-500">{s.hint}</p>

            {b.topic && (
              <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Your agenda
                </p>
                <p className="mt-1">{b.topic}</p>
              </div>
            )}

            {b.status === "declined" && b.mentorDeclineReason && (
              <div className="mt-3 rounded-md border border-error-200 bg-error-50 p-3 text-sm text-error-700">
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Reason
                </p>
                <p className="mt-1">{b.mentorDeclineReason}</p>
              </div>
            )}

            {b.status === "confirmed" && b.zoomJoinUrl && (
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={b.zoomJoinUrl} target="_blank" rel="noopener noreferrer">
                  <Button
                    size="sm"
                    variant="fellowship"
                    className="bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
                  >
                    Join Zoom
                  </Button>
                </a>
                <Button size="sm" variant="outline" onClick={() => cancel(b)}>
                  Cancel
                </Button>
              </div>
            )}

            {(b.status === "pending_mentor" || b.status === "pending_admin") && (
              <div className="mt-4">
                <Button size="sm" variant="outline" onClick={() => cancel(b)}>
                  Cancel request
                </Button>
              </div>
            )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
