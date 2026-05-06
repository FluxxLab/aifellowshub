"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { CalenderIcon, PlusIcon, TimeIcon } from "@/icons";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import type {
  BookingStatus,
  MentorBooking,
  MentorSlot,
} from "@/lib/api/mentorship";

type Props = {
  initialSlots: MentorSlot[];
  initialBookings: MentorBooking[];
};

const STATUS_COPY: Record<BookingStatus, { label: string; color: "info" | "success" | "warning" | "error" | "primary" }> = {
  pending: { label: "Awaiting admin", color: "warning" },
  confirmed: { label: "Confirmed", color: "success" },
  declined: { label: "Declined", color: "error" },
  cancelled: { label: "Cancelled", color: "info" },
  completed: { label: "Completed", color: "primary" },
};

export default function MentorAvailabilityView({
  initialSlots,
  initialBookings,
}: Props) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [slots, setSlots] = useState<MentorSlot[]>(initialSlots);
  const [bookings] = useState<MentorBooking[]>(initialBookings);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  async function addSlot(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) return;
    const startsAt = new Date(`${date}T${time}`);
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
      toast.error("Pick a future date and time.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch<{ slot: MentorSlot }>("/me/mentor/availability", {
        method: "POST",
        body: { startsAt: startsAt.toISOString(), durationMinutes: duration },
      });
      setSlots((prev) =>
        [...prev, { ...res.slot, booking: null }].sort(
          (a, b) => +new Date(a.startsAt) - +new Date(b.startsAt),
        ),
      );
      setDate("");
      setTime("");
      toast.success("Slot added", "Fellows can now request this time.");
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't add slot", err);
    }
    setSubmitting(false);
  }

  async function removeSlot(slot: MentorSlot) {
    const ok = await confirm({
      title: "Delete this slot?",
      message: "It will no longer be visible to fellows. Pending bookings on this slot must be cancelled first.",
      confirmLabel: "Delete slot",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await apiFetch(`/me/mentor/availability/${encodeURIComponent(slot.id)}`, {
        method: "DELETE",
      });
      setSlots((prev) => prev.filter((s) => s.id !== slot.id));
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't delete slot", err);
    }
  }

  const upcoming = slots.filter((s) => +new Date(s.startsAt) > Date.now());

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {dialog}
      <Breadcrumbs items={[{ label: "Home", href: "/mentor" }, { label: "Availability" }]} />

      <div>
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          Availability
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Publish 1:1 mentorship slots fellows can book. An admin reviews each
          request before it&apos;s confirmed — once approved, the admin hosts
          the Zoom call.
        </p>
      </div>

      <form
        onSubmit={addSlot}
        className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
      >
        <h2 className="text-lg font-semibold text-gray-800">Add a slot</h2>
        <p className="mt-1 text-sm text-gray-500">
          Pick a date, start time, and duration (15–240 minutes).
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              defaultValue={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Start time</Label>
            <Input
              type="time"
              defaultValue={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
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
          <div className="flex items-end">
            <Button
              type="submit"
              size="sm"
              variant="fellowship"
              disabled={submitting || !date || !time || duration < 15}
              className="w-full bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
              startIcon={<PlusIcon />}
            >
              {submitting ? "Adding…" : "Add slot"}
            </Button>
          </div>
        </div>
      </form>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <h2 className="text-lg font-semibold text-gray-800">Upcoming slots</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            No future slots yet. Add one above to start receiving bookings.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {upcoming.map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CalenderIcon className="h-4 w-4" />
                    {new Date(s.startsAt).toLocaleString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                    <TimeIcon className="h-3.5 w-3.5" />
                    {s.durationMinutes} min
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {s.booking ? (
                    <Badge color={STATUS_COPY[s.booking.status].color} variant="light">
                      {STATUS_COPY[s.booking.status].label}
                      {s.booking.fellow ? ` · ${s.booking.fellow.fullName}` : ""}
                    </Badge>
                  ) : (
                    <Badge color="info" variant="light">Open</Badge>
                  )}
                  {!s.booking && (
                    <Button size="sm" variant="outline" onClick={() => removeSlot(s)}>
                      Delete
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <h2 className="text-lg font-semibold text-gray-800">Your bookings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Visible to you for context. An admin handles approval and hosting.
        </p>
        {bookings.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No bookings yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {bookings.map((b) => (
              <li key={b.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800">
                    {b.fellow?.fullName ?? "Fellow"}
                  </p>
                  <Badge color={STATUS_COPY[b.status].color} variant="light">
                    {STATUS_COPY[b.status].label}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(b.slot.startsAt).toLocaleString(undefined, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {b.slot.durationMinutes} min
                </p>
                {b.topic && (
                  <p className="mt-2 rounded-md bg-gray-50 p-2 text-sm text-gray-700">
                    {b.topic}
                  </p>
                )}
                {b.zoomJoinUrl && b.status === "confirmed" && (
                  <p className="mt-2 text-xs">
                    <a
                      href={b.zoomJoinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-fellowship-navy hover:underline"
                    >
                      Join Zoom →
                    </a>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
