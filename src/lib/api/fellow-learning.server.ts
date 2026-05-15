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

type BackendAssessment = {
  id: string;
  moduleId: string;
  lessonId: string | null;
  kind: "pre" | "lesson" | "post";
  title: string;
  passingScore: number;
  timeLimitMinutes: number;
  attemptsAllowed: number;
  questionCount: number;
  hideScore: boolean;
};

type BackendCurriculumModule = {
  id: string;
  weekNumber: number;
  title: string;
  summary: string;
  overview: string | null;
  learningObjectives: string | null;
  keywords: string[];
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
    assessment: BackendAssessment | null;
  }[];
  resources: { id: string; title: string; url: string; kind: "pdf" | "link" | "video" }[];
  preAssessment: BackendAssessment | null;
  postAssessment: BackendAssessment | null;
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
  feedbackSubmitted: boolean;
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
  hasRecording?: boolean;
  recordingDurationSeconds?: number | null;
  myAttendance: {
    status: "rsvpd" | "attended" | "attended_recording" | "missed";
    minutesAttended: number | null;
    joinedAt: string | null;
    leftAt: string | null;
    recordingWatchedSeconds?: number;
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

/**
 * Map a backend assessment row to the `ModuleAssessment` shape the fellow
 * UI expects. Status is best-effort: per-tier attempts aren't yet
 * surfaced separately by the backend, so we use the module-level
 * `myAttempts` summary as a stand-in. Pre/post quizzes ignore
 * passingScore + bestScore in the UI (`hideScore=true`).
 */
function mapBackendAssessment(
  a: BackendAssessment,
  my: BackendCurriculumModule["myAttempts"],
): import("./fellow-learning").ModuleAssessment {
  // Pre/post are diagnostic — we only know whether the fellow has
  // submitted. Lesson quizzes use the same "passed/failed/not-started"
  // shape as the legacy module assessment until per-tier attempt
  // counts arrive on the backend response.
  const passed = my.bestStatus === "passed";
  const failed = my.bestStatus === "failed";
  let status: import("./fellow-learning").ModuleAssessment["status"];
  if (a.hideScore) {
    status = my.attemptsUsed > 0 ? "submitted" : "not-started";
  } else {
    status = passed ? "passed" : failed ? "failed" : "not-started";
  }
  return {
    id: a.id,
    moduleId: a.moduleId,
    lessonId: a.lessonId,
    kind: a.kind,
    title: a.title,
    timeLimitMinutes: a.timeLimitMinutes,
    attemptsAllowed: a.attemptsAllowed,
    attemptsUsed: my.attemptsUsed,
    passingScore: a.passingScore,
    status,
    bestScore: a.hideScore ? null : my.bestScore,
    attemptedAt: null,
    hideScore: a.hideScore,
  };
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

    // Orientation (Week 0) was conducted outside the LMS and isn't
    // graded — it has no assessment to pass, so the default rules
    // would leave it stuck on "available" forever. Force it to
    // "completed" so the curriculum reads cleanly and progress
    // counters tick up the way fellows expect.
    if (m.weekNumber <= 0) status = "completed";

    const hasAssessment =
      Boolean(m.preAssessment) ||
      Boolean(m.postAssessment) ||
      m.lessons.some((l) => Boolean(l.assessment));

    return {
      weekNumber: m.weekNumber,
      title: m.title,
      summary: m.summary,
      overview: m.overview ?? null,
      learningObjectives: m.learningObjectives ?? null,
      keywords: m.keywords ?? [],
      status,
      progressPercent:
        status === "completed" ? 100 : status === "in-progress" ? 50 : 0,
      sessionAttended: null, // sessions backend pending
      assessmentPassed: passed ? true : failed ? false : null,
      assessmentScore: my.bestScore,
      hasAssessment,
      durationMinutes: m.durationMinutes,
    };
  });
}

function mapBackendCurriculumModule(
  m: BackendCurriculumModule,
): FellowModuleDetail {
  const my = m.myAttempts;
  const passed = my.bestStatus === "passed";
  const failed = my.bestStatus === "failed";
  let status: FellowModuleSummary["status"];
  if (!m.unlocked) status = "locked";
  else if (passed) status = "completed";
  else if (my.attemptsUsed > 0) status = "in-progress";
  else status = "available";

  // Orientation (Week 0): always reads as completed. Matches the
  // list view's treatment so the detail page and curriculum index
  // stay in lockstep.
  if (m.weekNumber <= 0) status = "completed";

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
    assessment: l.assessment ? mapBackendAssessment(l.assessment, my) : null,
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
        title: m.title,
        status: "upcoming",
        startsAt: new Date().toISOString(),
        durationMinutes: 90,
        hostName: "TBD",
        rsvpd: false,
        attended: null,
        attendanceState: null,
        hasRecording: false,
        recordingDurationSeconds: null,
        recordingWatchedSeconds: 0,
        joinUrl: "#",
      };

  const hasAssessment =
    Boolean(m.preAssessment) ||
    Boolean(m.postAssessment) ||
    m.lessons.some((l) => Boolean(l.assessment));

  return {
    id: m.id,
    weekNumber: m.weekNumber,
    title: m.title,
    summary: m.summary,
    overview: m.overview ?? null,
    learningObjectives: m.learningObjectives ?? null,
    keywords: m.keywords ?? [],
    status,
    progressPercent:
      status === "completed" ? 100 : status === "in-progress" ? 50 : 0,
    sessionAttended: session.attended,
    assessmentPassed: passed ? true : failed ? false : null,
    assessmentScore: my.bestScore,
    hasAssessment,
    durationMinutes: m.durationMinutes,
    lessons,
    session,
    resources,
    feedbackSubmitted: m.feedbackSubmitted ?? false,
    preAssessment: m.preAssessment ? mapBackendAssessment(m.preAssessment, my) : null,
    postAssessment: m.postAssessment ? mapBackendAssessment(m.postAssessment, my) : null,
  };
}

/** Detail view for `/learning/[week]`. Returns null when backend unreachable or week not found. */
export async function getFellowModuleServer(
  week: number,
): Promise<FellowModuleDetail | null> {
  const real = await fetchCurriculum();
  if (!real) return null;
  const m = real.find((x) => x.weekNumber === week);
  if (!m) return null;
  return mapBackendCurriculumModule(m);
}

/**
 * Full curriculum as `FellowModuleDetail[]` — used by `/assessments` to
 * flatten every quiz across the cohort into one list. Returns `[]` when
 * the backend is unreachable so callers can render an empty state.
 */
export async function getFellowCurriculumDetailServer(): Promise<
  FellowModuleDetail[]
> {
  const real = await fetchCurriculum();
  if (!real) return [];
  return real.map(mapBackendCurriculumModule);
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
  const myStatus = b.myAttendance?.status ?? null;
  const moduleTitle = b.module?.title ?? "Untitled module";
  return {
    id: b.id,
    title: b.title || moduleTitle,
    weekNumber: b.module?.weekNumber ?? 0,
    moduleTitle,
    status,
    startsAt: b.startsAt,
    durationMinutes: b.durationMinutes,
    hostName: b.host?.fullName ?? "TBD",
    rsvpd: Boolean(b.myAttendance),
    attended:
      myStatus === "attended" || myStatus === "attended_recording"
        ? true
        : myStatus === "missed"
        ? false
        : null,
    attendanceState: mapAttendanceState(myStatus),
    hasRecording: Boolean(b.hasRecording),
    recordingDurationSeconds: b.recordingDurationSeconds ?? null,
    recordingWatchedSeconds: b.myAttendance?.recordingWatchedSeconds ?? 0,
    joinUrl: b.joinUrl ?? "#",
    attendanceThresholdMinutes: b.attendanceThresholdMinutes,
  };
}

function mapAttendanceState(
  status: string | null,
): ModuleSession["attendanceState"] {
  if (status === "attended") return "attended";
  if (status === "attended_recording") return "attended_recording";
  if (status === "missed") return "missed";
  return null;
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
  const myStatus = b.myAttendance?.status ?? null;
  return {
    id: b.id,
    title: b.title,
    status,
    startsAt: b.startsAt,
    durationMinutes: b.durationMinutes,
    hostName: b.host?.fullName ?? "TBD",
    rsvpd: Boolean(b.myAttendance),
    attended:
      myStatus === "attended" || myStatus === "attended_recording"
        ? true
        : myStatus === "missed"
        ? false
        : null,
    attendanceState: mapAttendanceState(myStatus),
    hasRecording: Boolean(b.hasRecording),
    recordingDurationSeconds: b.recordingDurationSeconds ?? null,
    recordingWatchedSeconds: b.myAttendance?.recordingWatchedSeconds ?? 0,
    joinUrl: b.joinUrl ?? "#",
  };
}
