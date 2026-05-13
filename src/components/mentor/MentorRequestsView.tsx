"use client";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import DatePicker from "@/components/form/date-picker";
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
 * Mentor's coaching-request inbox. Three actions on inbound rows
 * (accept / decline / past-delete). The "Schedule session" button
 * lets the mentor proactively initiate a 1-on-1 or group session
 * — those rows skip mentor-accept and go straight to pending_admin.
 */
export default function MentorRequestsView({
  initialBookings,
  fellows,
}: {
  initialBookings: MentorBooking[];
  fellows: { id: string; fullName: string }[];
}) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [bookings, setBookings] = useState(initialBookings);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]["id"]>(
    "pending_mentor",
  );
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const subset =
      filter === "all"
        ? bookings
        : bookings.filter((b) => b.status === filter);
    // Strict chronological order — earliest at top, latest at bottom.
    // The previous split (future ascending + past descending) read as
    // "out of order" because a May 12 past entry landed below May 19
    // future entries. A flat ascending sort scans like a calendar.
    return [...subset].sort(
      (a, b) =>
        +new Date(a.requestedStartsAt) - +new Date(b.requestedStartsAt),
    );
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
            Coaching requests
          </h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Review the proposed time from your fellows, or schedule a session
            yourself with one or more fellows.
          </p>
        </div>
        <Button
          size="sm"
          variant="fellowship"
          onClick={() => setScheduleOpen(true)}
          disabled={fellows.length === 0}
        >
          + Schedule session
        </Button>
      </div>

      <ScheduleSessionModal
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        fellows={fellows}
        onScheduled={(rows) => {
          setBookings((prev) => [...rows, ...prev]);
          toast.success(
            rows.length > 1
              ? `Group session scheduled with ${rows.length} fellows.`
              : "Session scheduled.",
            "An admin will confirm and create the Zoom meeting shortly.",
          );
          setScheduleOpen(false);
          router.refresh();
        }}
      />

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

/**
 * Modal for the mentor to schedule a new coaching session with one
 * or more fellows. Submits to POST /me/mentor/bookings.
 */
function ScheduleSessionModal({
  isOpen,
  onClose,
  fellows,
  onScheduled,
}: {
  isOpen: boolean;
  onClose: () => void;
  fellows: { id: string; fullName: string }[];
  onScheduled: (rows: MentorBooking[]) => void;
}) {
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const toggleFellow = (id: string) => {
    setPickedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const canSubmit = pickedIds.length > 0 && date !== "" && time !== "" && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    // The picker writes plain Y-M-D and H:i strings. Interpret them as
    // Africa/Lagos time (UTC+1, no DST) so an admin scheduling from any
    // timezone produces the same UTC instant fellows in Lagos see.
    // Without this, `new Date("2026-05-15T14:00:00")` parses in the
    // admin's local zone, which silently shifts the WAT display.
    const isoUtc = `${date}T${time}:00+01:00`;
    const isoLocal = new Date(isoUtc);
    if (Number.isNaN(isoLocal.getTime())) {
      toast.error("Pick a valid date and time");
      return;
    }
    if (isoLocal.getTime() <= Date.now()) {
      toast.error("Pick a time in the future");
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch<{ bookings: MentorBooking[] }>(
        "/me/mentor/bookings",
        {
          method: "POST",
          body: {
            fellowIds: pickedIds,
            requestedStartsAt: isoLocal.toISOString(),
            requestedDurationMinutes: durationMinutes,
            topic: topic.trim() || undefined,
          },
        },
      );
      onScheduled(res.bookings);
      // Reset for next open.
      setPickedIds([]);
      setDate("");
      setTime("");
      setDurationMinutes(30);
      setTopic("");
    } catch (err) {
      toast.errorFromException("Couldn't schedule the session", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-theme-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-800">
          Schedule a coaching session
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Pick one or more fellows and a time. An admin will confirm and
          create the Zoom meeting — group sessions share a single meeting.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Fellows
            </label>
            <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 p-2">
              {fellows.length === 0 ? (
                <p className="px-2 py-3 text-sm text-gray-500">
                  No fellows assigned to you yet.
                </p>
              ) : (
                fellows.map((f) => {
                  const selected = pickedIds.includes(f.id);
                  return (
                    <label
                      key={f.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleFellow(f.id)}
                      />
                      <span className="text-gray-800">{f.fullName}</span>
                    </label>
                  );
                })
              )}
            </div>
            {pickedIds.length > 1 && (
              <p className="mt-1 text-xs text-gray-500">
                Group session — all {pickedIds.length} fellows join the
                same meeting.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              id="schedule-session-date"
              mode="single"
              label="Date"
              placeholder="Select a date"
              minDate="today"
              onChange={(_dates, dateStr) => setDate(dateStr)}
            />
            <DatePicker
              id="schedule-session-time"
              mode="time"
              label="Time (WAT)"
              placeholder="Select a time"
              onChange={(_dates, dateStr) => setTime(dateStr)}
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Duration
            </label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="mt-1 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm"
            >
              <option value={15}>15 min</option>
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
              <option value={120}>120 min</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Agenda (optional)
            </label>
            <textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What you'll discuss"
              className="mt-1 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant="fellowship"
            onClick={submit}
            disabled={!canSubmit}
          >
            {busy ? "Scheduling…" : "Schedule"}
          </Button>
        </div>
      </div>
    </div>
  );
}
