"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import {
  deleteSession,
  upsertModuleSession,
  type FacultySession,
} from "@/lib/api/faculty";
import { toast } from "@/lib/toast";

/**
 * Faculty editor for a module's live session (BRD §6.4).
 *
 * Lets faculty/admin schedule the session, paste the Zoom join URL, and
 * either type the meeting id directly or have it auto-extracted from the
 * URL. Saving POSTs to `/modules/:id/session` (upsert).
 *
 * Session.id changes when a session is deleted and recreated, so we keep
 * the latest server-confirmed shape in local state and emit it upstream
 * via `onChange` so the parent's `assessment.moduleId`-style downstream
 * consumers (e.g., the Zoom signature mint) stay accurate.
 */
export default function FacultySessionCard({
  moduleId,
  session,
  onChange,
}: {
  moduleId: string;
  session: FacultySession | null;
  onChange: (next: FacultySession | null) => void;
}) {
  const { confirm, dialog } = useConfirm();
  const [draft, setDraft] = useState(() => initialDraft(session));
  const [busy, setBusy] = useState(false);
  const dirty = isDirty(draft, session);

  async function save() {
    const validationError = validate(draft);
    if (validationError) {
      toast.error("Check the form", validationError);
      return;
    }
    setBusy(true);
    try {
      // No joinUrl / zoomMeetingId in the payload — the backend's
      // ZoomService creates (or updates) the meeting via Server-to-
      // Server OAuth and persists the resulting id + URL itself.
      // Faculty don't see, type, or copy any Zoom URL.
      const saved = await upsertModuleSession(moduleId, {
        title: draft.title.trim(),
        startsAt: new Date(draft.startsAt).toISOString(),
        durationMinutes: Number(draft.durationMinutes),
        attendanceThresholdMinutes: draft.attendanceThresholdMinutes
          ? Number(draft.attendanceThresholdMinutes)
          : undefined,
      });
      onChange(saved);
      setDraft(initialDraft(saved));
      toast.success("Session saved");
    } catch (err) {
      toast.errorFromException("Couldn't save the session", err);
    }
    setBusy(false);
  }

  async function remove() {
    if (!session) return;
    const ok = await confirm({
      title: "Remove this session?",
      message: "Fellows will no longer see it on the module page.",
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await deleteSession(session.id);
      onChange(null);
      setDraft(initialDraft(null));
      toast.success("Session removed");
    } catch (err) {
      toast.errorFromException("Couldn't remove the session", err);
    }
    setBusy(false);
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Live session</h2>
        {session && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="text-xs font-medium text-error-600 hover:underline disabled:opacity-40"
          >
            Remove session
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500">
        One live session per module. The Zoom meeting is created
        automatically when you save — no URL to copy. Fellows join
        in-app via the embedded Meeting SDK. Attendance is
        auto-credited via webhook when a fellow stays at least the
        threshold below.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Session title">
          <input
            type="text"
            value={draft.title}
            disabled={busy}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="e.g. Week 3 live: Ethical reasoning"
            className={input}
          />
        </Field>
        <Field label="Starts at">
          <input
            type="datetime-local"
            value={draft.startsAt}
            disabled={busy}
            onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
            className={input}
          />
        </Field>
        <Field label="Duration (min)">
          <input
            type="number"
            min={15}
            max={600}
            value={draft.durationMinutes}
            disabled={busy}
            onChange={(e) =>
              setDraft({ ...draft, durationMinutes: e.target.value })
            }
            className={input}
          />
        </Field>
        <Field label="Auto-credit threshold (min)">
          <input
            type="number"
            min={1}
            max={600}
            value={draft.attendanceThresholdMinutes}
            disabled={busy}
            onChange={(e) =>
              setDraft({
                ...draft,
                attendanceThresholdMinutes: e.target.value,
              })
            }
            placeholder="default: 30"
            className={input}
          />
        </Field>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="fellowship"
          onClick={save}
          disabled={busy || !dirty}
        >
          {busy ? "Saving…" : session ? "Save changes" : "Schedule session"}
        </Button>
      </div>

      {dialog}
    </section>
  );
}

const input =
  "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10 disabled:bg-gray-50";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  );
}

type Draft = {
  title: string;
  startsAt: string;
  durationMinutes: string;
  attendanceThresholdMinutes: string;
};

function initialDraft(s: FacultySession | null): Draft {
  return {
    title: s?.title ?? "",
    startsAt: s ? toLocalDateTimeInput(s.startsAt) : "",
    durationMinutes: String(s?.durationMinutes ?? 90),
    attendanceThresholdMinutes: s?.attendanceThresholdMinutes
      ? String(s.attendanceThresholdMinutes)
      : "",
  };
}

function isDirty(draft: Draft, server: FacultySession | null): boolean {
  const server_ = initialDraft(server);
  return (
    draft.title !== server_.title ||
    draft.startsAt !== server_.startsAt ||
    draft.durationMinutes !== server_.durationMinutes ||
    draft.attendanceThresholdMinutes !== server_.attendanceThresholdMinutes
  );
}

function validate(d: Draft): string | null {
  if (d.title.trim().length < 2) return "Title is required.";
  if (!d.startsAt) return "Start time is required.";
  const dur = Number(d.durationMinutes);
  if (!Number.isInteger(dur) || dur < 15 || dur > 600)
    return "Duration must be between 15 and 600 minutes.";
  if (d.attendanceThresholdMinutes) {
    const th = Number(d.attendanceThresholdMinutes);
    if (!Number.isInteger(th) || th < 1 || th > 600)
      return "Threshold must be between 1 and 600 minutes.";
    if (th > dur) return "Threshold can't exceed the session duration.";
  }
  return null;
}

/** ISO timestamp → `YYYY-MM-DDTHH:mm` for `<input type="datetime-local">`. */
function toLocalDateTimeInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
