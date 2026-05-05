/**
 * Server-only fellow learning surface (BRD §6.3, §6.4).
 *
 * Wraps the backend's `GET /me/curriculum` and `GET /me/sessions`
 * endpoints. When the backend is unreachable, surfaces are returned
 * empty — pages render their zero-state.
 */
import "server-only";
import { backendFetch } from "./backend";
import type {
  FellowModuleDetail,
  FellowModuleSummary,
  Lesson,
  ModuleResource,
  ModuleSession,
} from "./fellow-learning";

type BackendCurriculumModule = {
  id: string;
  weekNumber: number;
  title: string;
  summary: string;
  durationMinutes: number;
  lessons: {
    id: string;
    title: string;
    summary: string;
    kind: "reading" | "video" | "exercise";
    durationMinutes: number;
    contentUrl: string | null;
    contentMimeType: string | null;
    contentBytes: number | null;
  }[];
  resources: { id: string; title: string; url: string; kind: "pdf" | "link" | "video" }[];
  assessment: {
    id: string;
    moduleId: string;
    title: string;
    passingScore: number;
    timeLimitMinutes: number;
    attemptsAllowed: number;
    questionCount: number;
  } | null;
  session: BackendSession | null;
  myAttempts: {
    attemptsUsed: number;
    attemptsAllowed: number;
    canStart: boolean;
    blockReason: "passed" | "pending_review" | "no_attempts_left" | null;
    bestAttemptId: string | null;
    bestScore: number | null;
    bestStatus: "passed" | "failed" | "pending_review" | null;
    latestAttemptId: string | null;
    latestStatus: "passed" | "failed" | "pending_review" | null;
  };
  unlocked: boolean;
};

type BackendSession = {
  id: string;
  moduleId: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  attendanceThresholdMinutes: number;
  joinUrl: string | null;
  host: { id: string; fullName: string } | null;
  status: "scheduled" | "live" | "ended" | "cancelled";
  myAttendance: {
    status: "rsvpd" | "attended" | "missed";
    minutesAttended: number | null;
    joinedAt: string | null;
    leftAt: string | null;
  } | null;
};

async function fetchCurriculum(): Promise<BackendCurriculumModule[] | null> {
  try {
    const res = await backendFetch("/me/curriculum", { method: "GET" });
    if (!res.ok) return null;
    const data = (await res.json()) as { modules: BackendCurriculumModule[] };
    return data.modules;
  } catch {
    return null;
  }
}

/** List view for `/learning`. Returns `[]` if the backend is unreachable. */
export async function getFellowCurriculumServer(): Promise<FellowModuleSummary[]> {
  const real = await fetchCurriculum();
  if (!real) return [];

  return real.map((m) => {
    const my = m.myAttempts;
    const passed = my.bestStatus === "passed";
    const failed = my.bestStatus === "failed";
    let status: FellowModuleSummary["status"];
    if (!m.unlocked) status = "locked";
    else if (passed) status = "completed";
    else if (my.attemptsUsed > 0) status = "in-progress";
    else status = "available";

    return {
      weekNumber: m.weekNumber,
      title: m.title,
      summary: m.summary,
      status,
      progressPercent:
        status === "completed" ? 100 : status === "in-progress" ? 50 : 0,
      sessionAttended: null, // sessions backend pending
      assessmentPassed: passed ? true : failed ? false : null,
      assessmentScore: my.bestScore,
      durationMinutes: m.durationMinutes,
    };
  });
}

/** Detail view for `/learning/[week]`. Returns null when backend unreachable or week not found. */
export async function getFellowModuleServer(
  week: number,
): Promise<FellowModuleDetail | null> {
  const real = await fetchCurriculum();
  if (!real) return null;

  const m = real.find((x) => x.weekNumber === week);
  if (!m) return null;

  const my = m.myAttempts;
  const passed = my.bestStatus === "passed";
  const failed = my.bestStatus === "failed";
  let status: FellowModuleSummary["status"];
  if (!m.unlocked) status = "locked";
  else if (passed) status = "completed";
  else if (my.attemptsUsed > 0) status = "in-progress";
  else status = "available";

  // Map lessons; mark all as not-started for now (lesson-progress backend TBD).
  const lessons: Lesson[] = m.lessons.map((l) => ({
    id: l.id,
    title: l.title,
    summary: l.summary,
    kind: l.kind,
    durationMinutes: l.durationMinutes,
    status: status === "completed" ? "completed" : "not-started",
    contentUrl: l.contentUrl ?? null,
    contentMimeType: l.contentMimeType ?? null,
  }));

  const resources: ModuleResource[] = m.resources.map((r) => ({
    id: r.id,
    title: r.title,
    kind: r.kind,
    url: r.url,
  }));

  // Session: real backend session if scheduled for this module, else fall
  // back to a placeholder so the SessionCard still renders cleanly.
  const session: ModuleSession = m.session
    ? mapBackendSession(m.session)
    : {
        id: null,
        status: "upcoming",
        startsAt: new Date().toISOString(),
        durationMinutes: 90,
        hostName: "TBD",
        rsvpd: false,
        attended: null,
        joinUrl: "#",
      };

  // Pull attempt status from the backend ("not-started" | "passed" | "failed";
  // "in-progress" lives in mock for now since attempts can't be partially
  // submitted yet).
  const assessmentStatus: "not-started" | "passed" | "failed" =
    passed ? "passed" : failed ? "failed" : "not-started";

  return {
    weekNumber: m.weekNumber,
    title: m.title,
    summary: m.summary,
    status,
    progressPercent:
      status === "completed" ? 100 : status === "in-progress" ? 50 : 0,
    sessionAttended: session.attended,
    assessmentPassed: passed ? true : failed ? false : null,
    assessmentScore: my.bestScore,
    durationMinutes: m.durationMinutes,
    lessons,
    session,
    resources,
    assessment: m.assessment
      ? {
          id: m.assessment.id,
          moduleId: m.assessment.moduleId,
          title: m.assessment.title,
          timeLimitMinutes: m.assessment.timeLimitMinutes,
          attemptsAllowed: m.assessment.attemptsAllowed,
          attemptsUsed: my.attemptsUsed,
          passingScore: m.assessment.passingScore,
          status: assessmentStatus,
          bestScore: my.bestScore,
          attemptedAt: null,
        }
      : {
          // Module has no assessment configured. Render a stub that the UI
          // can disable cleanly (questionCount via attemptsAllowed=0 makes
          // the "Start assessment" button render as "No assessment yet").
          id: `no-assess-${m.id}`,
          moduleId: m.id,
          title: `Week ${m.weekNumber} assessment`,
          timeLimitMinutes: 30,
          attemptsAllowed: 0,
          attemptsUsed: 0,
          passingScore: 70,
          status: "not-started",
          bestScore: null,
          attemptedAt: null,
        },
  };
}

/** Full cohort sessions list for `/my-sessions`. Empty when backend unreachable. */
export async function getFellowSessionsServer() {
  try {
    const res = await backendFetch("/me/sessions", { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as { sessions: BackendListedSession[] };
    return (data.sessions ?? []).map(mapBackendListedSession);
  } catch {
    return [];
  }
}

type BackendListedSession = BackendSession & {
  module: { id: string; title: string; weekNumber: number } | null;
};

function mapBackendListedSession(b: BackendListedSession) {
  const status: "upcoming" | "live" | "ended" | "cancelled" =
    b.status === "scheduled"
      ? "upcoming"
      : b.status === "live"
      ? "live"
      : b.status === "cancelled"
      ? "cancelled"
      : "ended";
  return {
    id: b.id,
    weekNumber: b.module?.weekNumber ?? 0,
    moduleTitle: b.module?.title ?? "Untitled module",
    status,
    startsAt: b.startsAt,
    durationMinutes: b.durationMinutes,
    hostName: b.host?.fullName ?? "TBD",
    rsvpd: Boolean(b.myAttendance),
    attended:
      b.myAttendance?.status === "attended"
        ? true
        : b.myAttendance?.status === "missed"
        ? false
        : null,
    joinUrl: b.joinUrl ?? "#",
    attendanceThresholdMinutes: b.attendanceThresholdMinutes,
  };
}

function mapBackendSession(b: BackendSession): ModuleSession {
  const status: ModuleSession["status"] =
    b.status === "scheduled"
      ? "upcoming"
      : b.status === "live"
      ? "live"
      : b.status === "cancelled"
      ? "cancelled"
      : "ended";
  return {
    id: b.id,
    status,
    startsAt: b.startsAt,
    durationMinutes: b.durationMinutes,
    hostName: b.host?.fullName ?? "TBD",
    rsvpd: Boolean(b.myAttendance),
    attended:
      b.myAttendance?.status === "attended"
        ? true
        : b.myAttendance?.status === "missed"
        ? false
        : null,
    joinUrl: b.joinUrl ?? "#",
  };
}
