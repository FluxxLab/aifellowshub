"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import DatePicker from "@/components/form/date-picker";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";

/**
 * Edit a scheduled session — rename it and/or move it to a new start
 * time / duration. Pre-fills with the current values so admins typically
 * only change one thing.
 */
export default function RescheduleSessionModal({
  isOpen,
  onClose,
  sessionId,
  sessionTitle,
  currentStartsAt,
  currentDurationMinutes,
}: {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle: string;
  currentStartsAt: string;
  currentDurationMinutes: number;
}) {
  const router = useRouter();
  const start = new Date(currentStartsAt);
  const initialDate = isoDate(start);
  const initialTime = isoTime(start);

  const [title, setTitle] = useState(sessionTitle);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [duration, setDuration] = useState(currentDurationMinutes);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2) {
      toast.error("Session name must be at least 2 characters.");
      return;
    }
    if (!date || !time) {
      toast.error("Pick a date and start time.");
      return;
    }
    const startsAt = new Date(`${date}T${time}`);
    if (Number.isNaN(startsAt.getTime())) {
      toast.error("Invalid date or time.");
      return;
    }
    if (startsAt.getTime() <= Date.now()) {
      toast.error("Pick a time in the future.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch(`/sessions/${encodeURIComponent(sessionId)}/reschedule`, {
        method: "PATCH",
        body: {
          title: trimmedTitle,
          startsAt: startsAt.toISOString(),
          durationMinutes: duration,
        },
      });
      toast.success("Session updated");
      router.refresh();
      onClose();
    } catch (err) {
      toast.errorFromException("Couldn't update session", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-lg">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-title-sm font-bold text-gray-800">
            Edit session
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Rename or move this session. Registered fellows are notified of changes.
          </p>
        </div>

        <div className="mb-4">
          <Label>Session name</Label>
          <Input
            type="text"
            defaultValue={title}
            placeholder="e.g. Week 3 — Governance Frameworks"
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DatePicker
            id={`reschedule-date-${sessionId}`}
            label="Date"
            placeholder="Pick a date"
            minDate="today"
            defaultDate={initialDate}
            onChange={(_, dateStr) => setDate(dateStr)}
          />
          <DatePicker
            id={`reschedule-time-${sessionId}`}
            mode="time"
            label="Start time"
            placeholder="--:--"
            defaultDate={initialTime}
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

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="fellowship"
            size="sm"
            type="submit"
            disabled={submitting}
            className="bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
          >
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
