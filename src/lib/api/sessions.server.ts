/**
 * Server-only admin session fetchers (BRD §6.4). Uses `next/headers` (via
 * `backendFetch`) — never import from a client component.
 *
 * Maps the backend's roster response to the existing `SessionDetail` shape
 * the admin pages already render, so no UI rewrite is needed.
 */
import "server-only";
import { backendFetch } from "./backend";
import type {
  AttendanceRecord,
  LiveSession,
  SessionDetail,
  SessionStatus,
} from "./sessions";

type BackendAdminListSession = {
  id: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  attendanceThresholdMinutes: number;
  status: SessionStatus;
  host: { id: string; fullName: string } | null;
  teachers: { id: string; fullName: string }[];
  module: {
    id: string;
    title: string;
    weekNumber: number;
    course: { id: string; title: string } | null;
  } | null;
  rsvpCount: number;
  attendedCount: number;
  expectedCount: number;
  hasRecording?: boolean;
};

/** Cohort-wide admin session list. Returns `[]` if backend unreachable. */
export async function getSessionsServer(): Promise<LiveSession[]> {
  try {
    const res = await backendFetch("/sessions", { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as { sessions: BackendAdminListSession[] };
    return (data.sessions ?? []).map(mapToLiveSession);
  } catch {
    return [];
  }
}

function mapToLiveSession(s: BackendAdminListSession): LiveSession {
  const scheduledStart = s.startsAt;
  const scheduledEnd = new Date(
    new Date(s.startsAt).getTime() + s.durationMinutes * 60_000,
  ).toISOString();
  return {
    id: s.id,
    weekNumber: s.module?.weekNumber ?? 0,
    moduleTitle: s.module?.title ?? "Untitled module",
    title: s.title,
    hostId: s.host?.id ?? "",
    hostName: s.host?.fullName ?? "TBD",
    teachers: s.teachers ?? [],
    scheduledStart,
    scheduledEnd,
    durationMinutes: s.durationMinutes,
    status: s.status,
    rsvpCount: s.rsvpCount + s.attendedCount,
    attendedCount: s.status === "ended" ? s.attendedCount : undefined,
    expectedCount: s.expectedCount,
    attendanceThresholdMinutes: s.attendanceThresholdMinutes,
    hasRecording: Boolean(s.hasRecording),
  };
}

type BackendAdminAttendance = {
  id: string;
  fellow: { id: string; fullName: string; email: string };
  status: "rsvpd" | "attended" | "missed";
  minutesAttended: number | null;
  joinedAt: string | null;
  leftAt: string | null;
};

type BackendAdminSession = {
  id: string;
  moduleId: string;
  module: {
    id: string;
    title: string;
    weekNumber: number;
    course: { id: string; title: string } | null;
  } | null;
  title: string;
  startsAt: string;
  durationMinutes: number;
  attendanceThresholdMinutes: number;
  joinUrl: string | null;
  zoomMeetingId: string | null;
  host: { id: string; fullName: string } | null;
  teachers: { id: string; fullName: string }[];
  status: SessionStatus;
  attendance: BackendAdminAttendance[];
};

/** Fetch the admin/faculty roster view for a session. Returns `null` on
 *  unreachable backend so the page can fall back to the mock detail. */
export async function getSessionAdminServer(
  sessionId: string,
): Promise<SessionDetail | null> {
  try {
    const res = await backendFetch(
      `/sessions/${encodeURIComponent(sessionId)}/admin`,
      { method: "GET" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { session: BackendAdminSession };
    return mapToSessionDetail(data.session);
  } catch {
    return null;
  }
}

function mapToSessionDetail(s: BackendAdminSession): SessionDetail {
  const expectedCount = s.attendance.length;
  const attendedCount = s.attendance.filter((a) => a.status === "attended")
    .length;
  const rsvpCount = s.attendance.filter((a) => a.status === "rsvpd")
    .length + attendedCount;

  const attendance: AttendanceRecord[] = s.attendance.map((a) => ({
    fellowId: a.fellow.id,
    fellowName: a.fellow.fullName,
    joinedAt: a.joinedAt,
    leftAt: a.leftAt,
    totalMinutesPresent: a.minutesAttended ?? 0,
    autoCredited: a.status === "attended",
    // Only show "In session" while the meeting is live. Once ended the
    // Zoom leave webhook may never have fired for everyone — suppress
    // the flag so the roster shows their real credited status instead.
    inSession: a.joinedAt !== null && a.leftAt === null && s.status !== "ended",
    override: null,
  }));

  const scheduledStart = s.startsAt;
  const scheduledEnd = new Date(
    new Date(s.startsAt).getTime() + s.durationMinutes * 60_000,
  ).toISOString();

  return {
    id: s.id,
    weekNumber: s.module?.weekNumber ?? 0,
    moduleTitle: s.module?.title ?? "Untitled module",
    title: s.title,
    hostId: s.host?.id ?? "",
    hostName: s.host?.fullName ?? "TBD",
    teachers: s.teachers ?? [],
    scheduledStart,
    scheduledEnd,
    durationMinutes: s.durationMinutes,
    status: s.status,
    rsvpCount,
    attendedCount: s.status === "ended" ? attendedCount : undefined,
    expectedCount,
    attendanceThresholdMinutes: s.attendanceThresholdMinutes,
    hasRecording: Boolean(
      (s as { hasRecording?: boolean }).hasRecording,
    ),
    attendance,
    joinUrl: s.joinUrl,
    zoomMeetingId: s.zoomMeetingId,
  };
}
