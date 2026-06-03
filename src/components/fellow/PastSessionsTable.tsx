"use client";
import React from "react";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import {
  CheckLineIcon,
  ChevronRightIcon,
  CloseLineIcon,
} from "@/icons";
import type { FellowSession } from "@/lib/api/fellow-learning";

/**
 * Past-sessions table for /my-sessions.
 *
 * "Watch recording" links to the module's lesson page (/learning/:week)
 * where the uploaded lesson videos live. The LessonVideoPlayer there
 * posts watch-time heartbeats to both the lesson-progress and the
 * session recording-progress endpoints, so the admin RECORDING column
 * reflects real lesson-video watch time.
 */
export default function PastSessionsTable({
  sessions,
}: {
  sessions: FellowSession[];
}) {
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
                        <Link
                          href={`/learning/${s.weekNumber}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-fellowship-navy hover:text-fellowship-navy-dark"
                        >
                          Watch recording
                        </Link>
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
        Live attendance counts as full credit. Watch the lesson videos to
        catch up on a missed session — your progress is tracked
        automatically.
      </p>
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
  if (state === "excused") {
    return (
      <Badge color="info" variant="light">
        <CheckLineIcon className="h-3.5 w-3.5" />
        Excused
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
