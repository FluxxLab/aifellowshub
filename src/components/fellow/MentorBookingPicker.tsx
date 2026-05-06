"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import { CalenderIcon, TimeIcon } from "@/icons";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { AvailabilitySlot } from "@/lib/api/mentorship";

type Props = {
  mentorId: string;
  slots: AvailabilitySlot[];
};

/**
 * Slot picker + topic field. Submitting creates a booking in `pending`
 * status — admin approval mints the Zoom meeting and flips it to
 * `confirmed`. The fellow tracks the request from `/my-bookings`.
 */
export default function MentorBookingPicker({ mentorId, slots }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(slots[0]?.id ?? null);
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">
          No open slots right now. Check back later.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || submitting) return;
    setSubmitting(true);
    try {
      await apiFetch(`/mentors/${encodeURIComponent(mentorId)}/bookings`, {
        method: "POST",
        body: { slotId: selected, topic: topic.trim() || undefined },
      });
      toast.success(
        "Request sent",
        "An admin will confirm and share the Zoom link.",
      );
      router.push("/my-bookings");
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't send request", err);
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:col-span-2 md:p-6">
        <h2 className="text-lg font-semibold text-gray-800">Pick a slot</h2>
        <p className="mt-1 text-sm text-gray-500">
          Times shown in your local timezone.
        </p>
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {slots.map((s) => {
            const start = new Date(s.startsAt);
            const active = selected === s.id;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSelected(s.id)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-colors",
                    active
                      ? "border-fellowship-navy bg-fellowship-navy/5"
                      : "border-gray-200 hover:border-fellowship-navy/40",
                  )}
                  aria-pressed={active}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <CalenderIcon className="h-4 w-4" />
                    {start.toLocaleDateString(undefined, {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
                    <TimeIcon className="h-3.5 w-3.5" />
                    {start.toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {s.durationMinutes} min
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <h2 className="text-lg font-semibold text-gray-800">Booking details</h2>
        <div className="mt-4">
          <Label>What would you like to discuss? (optional)</Label>
          <textarea
            rows={5}
            maxLength={1000}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Briefly describe what you want help with."
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-fellowship-navy focus:outline-none focus:ring-1 focus:ring-fellowship-navy"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          variant="fellowship"
          disabled={!selected || submitting}
          className="mt-4 w-full bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
        >
          {submitting ? "Sending…" : "Request booking"}
        </Button>
        <p className="mt-3 text-xs text-gray-500">
          An admin will review and confirm. You&apos;ll see the Zoom link on
          your bookings page once it&apos;s approved.
        </p>
      </section>
    </form>
  );
}
