"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import { CalenderIcon, TimeIcon } from "@/icons";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import type {
  AssignedMentorResult,
} from "@/lib/api/mentorship.server";
import type { BookingStatus, FellowBooking } from "@/lib/api/mentorship";

const STATUS_COPY: Record<
  BookingStatus,
  {
    label: string;
    color: "info" | "success" | "warning" | "error" | "primary";
    hint: string;
  }
> = {
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
    hint: "This session was cancelled.",
  },
  completed: {
    label: "Completed",
    color: "primary",
    hint: "This session has ended.",
  },
};

/**
 * Combined fellow page: assigned-mentor request form + booking history.
 * No mentor picker — assignment is automatic by sector.
 */
export default function FellowMentorshipView({
  assigned,
  initialBookings,
}: {
  assigned: AssignedMentorResult;
  initialBookings: FellowBooking[];
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [bookings, setBookings] = useState(initialBookings);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = assigned.ok && date && time && duration >= 15 && !submitting;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const startsAt = new Date(`${date}T${time}`);
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      toast.error("Pick a future date and time.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch<{ booking: FellowBooking }>("/me/bookings", {
        method: "POST",
        body: {
          requestedStartsAt: startsAt.toISOString(),
          requestedDurationMinutes: duration,
          topic: topic.trim() || undefined,
        },
      });
      setBookings((prev) => [res.booking, ...prev]);
      setDate("");
      setTime("");
      setDuration(30);
      setTopic("");
      toast.success(
        "Request sent",
        "Your mentor will accept or suggest a different time.",
      );
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't send request", err);
    }
    setSubmitting(false);
  }

  async function cancel(b: FellowBooking) {
    const ok = await confirm({
      title: "Cancel this session?",
      message: "The session will be removed from your list.",
      confirmLabel: "Cancel session",
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
            ? {
                ...x,
                status: "cancelled",
                cancelledAt: new Date().toISOString(),
              }
            : x,
        ),
      );
      toast.success("Session cancelled");
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't cancel", err);
    }
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {dialog}

      {/* Request form (or no-mentor empty state) */}
      {!assigned.ok ? (
        <div className="rounded-2xl border border-warning-200 bg-warning-50 p-5 md:p-6">
          <h2 className="text-base font-semibold text-gray-800">
            No mentor assigned yet
          </h2>
          <p className="mt-2 text-sm text-gray-700">{assigned.message}</p>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-gray-800">
                Request a session
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Pick a date, start time, and how long you&apos;d like the
                call. Times are in your local timezone.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Your mentor
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {assigned.mentor.fullName}
              </p>
              {assigned.mentor.sector && (
                <p className="text-xs text-gray-500">
                  {assigned.mentor.sector.replace(/_/g, " ")}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <DatePicker
              id="mentorship-date"
              label="Date"
              placeholder="Pick a date"
              minDate="today"
              onChange={(_, dateStr) => setDate(dateStr)}
            />
            <DatePicker
              id="mentorship-time"
              mode="time"
              label="Start time"
              placeholder="--:--"
              onChange={(_, timeStr) => setTime(timeStr)}
            />
            <div>
              <Label>Duration (min)</Label>
              <Input
                type="number"
                min="15"
                step={5}
                defaultValue={String(duration)}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="mt-5">
            <Label>What would you like to discuss? (optional)</Label>
            <textarea
              rows={3}
              maxLength={1000}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Briefly describe what you want help with."
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-fellowship-navy focus:outline-none focus:ring-1 focus:ring-fellowship-navy"
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              type="submit"
              size="sm"
              variant="fellowship"
              disabled={!canSubmit}
              className="bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
            >
              {submitting ? "Sending…" : "Send request"}
            </Button>
          </div>
        </form>
      )}

      {/* History */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          Your sessions
        </h2>
        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-sm text-gray-500">
              No mentorship sessions yet. Send a request above.
            </p>
          </div>
        ) : (
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
                          timeZone: "Africa/Lagos",
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
                      <a
                        href={b.zoomJoinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          size="sm"
                          variant="fellowship"
                          className="bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
                        >
                          Join Zoom
                        </Button>
                      </a>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancel(b)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {(b.status === "pending_mentor" ||
                    b.status === "pending_admin") && (
                    <div className="mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancel(b)}
                      >
                        Cancel request
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
