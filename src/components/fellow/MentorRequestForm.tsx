"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";

/**
 * Fellow's coaching-request form.
 *
 * No mentor-published slots — fellow picks any future date/time and a
 * duration. Backend creates a `pending_mentor` booking; mentor accepts
 * or declines next, then admin approves.
 */
export default function MentorRequestForm({ mentorId }: { mentorId: string }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = date && time && duration >= 15 && !submitting;

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
      await apiFetch(`/mentors/${encodeURIComponent(mentorId)}/bookings`, {
        method: "POST",
        body: {
          requestedStartsAt: startsAt.toISOString(),
          requestedDurationMinutes: duration,
          topic: topic.trim() || undefined,
        },
      });
      toast.success(
        "Request sent",
        "Your mentor will accept or suggest a different time.",
      );
      router.push("/my-bookings");
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't send request", err);
    }
    setSubmitting(false);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
    >
      <h2 className="text-lg font-semibold text-gray-800">
        Propose a coaching time
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Pick a date, start time, and how long you&apos;d like the call to
        be. Your mentor reviews the request next; an admin then confirms
        and you&apos;ll get the Zoom link.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
      </div>

      <div className="mt-5">
        <Label>What would you like to discuss? (optional)</Label>
        <textarea
          rows={4}
          maxLength={1000}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Briefly describe what you want help with."
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-fellowship-navy focus:outline-none focus:ring-1 focus:ring-fellowship-navy"
        />
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          Times are in your local timezone.
        </p>
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
  );
}
