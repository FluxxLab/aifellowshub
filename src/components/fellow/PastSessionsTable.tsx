"use client";
import React, { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import RecordingPlayer from "@/components/fellow/RecordingPlayer";
import {
  CheckLineIcon,
  ChevronRightIcon,
  CloseLineIcon,
} from "@/icons";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import type { FellowSession } from "@/lib/api/fellow-learning";

/**
 * Past-sessions table for /my-sessions.
 *
 * Adds the "Watch recording" entry next to the module link when a
 * session has been recorded (and archived to DO Spaces). Watching ≥
 * 50% of the recording earns half-credit attendance — the inline
 * `RecordingPlayer` posts watched-seconds heartbeats to the backend
 * which flips the fellow's status to attended_recording when the
 * threshold is crossed.
 */
export default function PastSessionsTable({
  sessions,
}: {
  sessions: FellowSession[];
}) {
  const [open, setOpen] = useState<{
    sessionId: string;
    videoUrl: string;
    durationSeconds: number | null;
  } | null>(null);

  async function watchRecording(s: FellowSession) {
    if (!s.id) return;
    try {
      const res = await apiFetch<{ url: string | null }>(
        `/sessions/${encodeURIComponent(s.id)}/recording-url`,
      );
      if (!res.url) {
        toast.error("Recording isn't available yet — try again shortly.");
        return;
      }
      setOpen({
        sessionId: s.id,
        videoUrl: res.url,
        durationSeconds: s.recordingDurationSeconds,
      });
    } catch (err) {
      toast.errorFromException("Couldn't load recording", err);
    }
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-5 py-3">Week</th>
              <th className="px-5 py-3">Module</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Host</th>
              <th className="px-5 py-3">Attendance</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sessions.map((s) => {
              const start = new Date(s.startsAt);
              // Orientation (Week 0 + title matches /onboarding/i) was
              // conducted outside the LMS. There's no real Zoom meeting
              // record, so date and host are placeholders — render
              // "Closed" instead so fellows don't see a synthetic date.
              const isOnboarding =
                s.weekNumber <= 0 && /onboarding/i.test(s.moduleTitle);
              return (
                <tr key={s.weekNumber} className="text-gray-700">
                  <td className="px-5 py-3 font-medium text-gray-800">
                    {s.weekNumber}
                  </td>
                  <td className="px-5 py-3">{s.moduleTitle}</td>
                  <td className="px-5 py-3">
                    {isOnboarding
                      ? "Closed"
                      : start.toLocaleDateString(undefined, {
                          timeZone: "Africa/Lagos",
                          day: "numeric",
                          month: "short",
                        })}
                  </td>
                  <td className="px-5 py-3">
                    {isOnboarding ? "Closed" : s.hostName}
                  </td>
                  <td className="px-5 py-3">
                    <AttendanceBadge
                      state={isOnboarding ? "attended" : s.attendanceState}
                    />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {s.hasRecording && (
                        <button
                          type="button"
                          onClick={() => void watchRecording(s)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-fellowship-navy hover:text-fellowship-navy-dark"
                        >
                          Watch recording
                        </button>
                      )}
                      <Link
                        href={`/learning/${s.weekNumber}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-fellowship-navy hover:text-fellowship-navy-dark"
                      >
                        Open module
                        <ChevronRightIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Live attendance counts as full credit. You earn half-credit only if
        you watch the full recording end-to-end — skipping ahead doesn&apos;t
        count. Either path completes the module for unlock purposes.
      </p>

      {open && (
        <RecordingPlayer
          isOpen={true}
          onClose={() => setOpen(null)}
          sessionId={open.sessionId}
          videoUrl={open.videoUrl}
          durationSeconds={open.durationSeconds}
        />
      )}
    </>
  );
}

function AttendanceBadge({
  state,
}: {
  state: FellowSession["attendanceState"];
}) {
  if (state === "attended") {
    return (
      <Badge color="success" variant="light">
        <CheckLineIcon className="h-3.5 w-3.5" />
        Attended
      </Badge>
    );
  }
  if (state === "attended_recording") {
    return (
      <Badge color="info" variant="light">
        <CheckLineIcon className="h-3.5 w-3.5" />
        Attended (recording · half-credit)
      </Badge>
    );
  }
  return (
    <Badge color="light" variant="light">
      <CloseLineIcon className="h-3.5 w-3.5" />
      Missed
    </Badge>
  );
}
