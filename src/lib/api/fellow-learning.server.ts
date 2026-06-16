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
  FellowSession,
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
    watchedSeconds: number;
    completedAt: string | null;
  }[];
  resources: { id: string; title: string; url: string; kind: "pdf" | "link" | "video" }[];
  preAssessment: BackendAssessment | null;
  postAssessment: BackendAssessment | null;
  session: BackendSession | null;
  /** True if the fellow attended ANY session for this module (all sessions checked, not just the primary). */
  sessionAttended: boolean;
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
    status: "rsvpd" | "attended" | "attended_recording" | "excused" | "missed";
    minutesAttended: number | null;
    joinedAt: string | null;
    leftAt: string | null;
    recordingWatchedSeconds?: number;
  } | null;
};

async function fetchCurriculum(): Promise<BackendCurriculumModule[] | null> {
  try {
    const res = await backendFetch("/me/curriculum", { method: "GET" });
    if (!res.ok) {
      // Log the real reason (status only — never the JWT/body) so a
      // recurring "couldn't load your modules" can be diagnosed from the
      // Vercel function logs: a 500 means a backend/data bug for that
      // fellow; a 401/403 means a session problem; a 502/503/504 means a
      // gateway/cold-start blip (already retried by backendFetch).
      console.error(`[curriculum] /me/curriculum responded ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { modules: BackendCurriculumModule[] };
    return data.modules;
  } catch (err) {
    // Network-level failure after retries (timeout/abort/DNS). Log the
    // error shape only — no URL, no token — so it's safe in aggregators.
    const safe =
      err instanceof Error
        ? { name: err.name, message: err.message, code: (err as { code?: string }).code }
        : { message: "unknown error" };
    console.error("[curriculum] /me/curriculum fetch failed:", safe);
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

/**
 * List view for `/learning`.
 *
 * Throws when the backend can't be reached (after retries) so the route's
 * error.tsx shows a "couldn't load — try again" state. A genuinely empty
 * cohort returns `[]` (the backend responded with no modules), which the
 * page renders as the friendly "no modules published yet" empty state.
 * The distinction matters: a transient failure must NOT masquerade as an
 * empty curriculum ("0 of 0 modules").
 */
export async function getFellowCurriculumServer(): Promise<FellowModuleSummary[]> {
  const real = await fetchCurriculum();
  if (!real) {
    throw new Error("Could not load your curriculum — please try again.");
  }

  return real.map((m) => {
    const my = m.myAttempts;
    const passed = my.bestStatus === "passed";
    const failed = my.bestStatus === "failed";
    // A module is completed via one of two paths (BRD §6.3):
    //   Path 1 (live): attended the session (all sessions for this module have run)
    //   Path 2 (async): passed the post-quiz AND submitted end-of-module feedback
    // Feedback submission is the final gate on the async path — it's what
    // actually trips the backend unlock cascade, so it's the reliable signal
    // that the full assessment path was completed (not just the post-quiz alone).
    const isCompleted = m.sessionAttended || (passed && m.feedbackSubmitted);
    let status: FellowModuleSummary["status"];
    if (!m.unlocked) status = "locked";
    else if (isCompleted) status = "completed";
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

    // Derive sessionAttended from the same backend payload the detail
    // mapper uses. Same clamps as elsewhere:
    //   - Onboarding (Week 0 + title matches /onboarding/i) → forced
    //     true because orientation was conducted outside the LMS.
    //   - Otherwise honour the attendance row, but only treat a
    //     "missed" row as false once the session has actually ended
    //     (both DB status === "ended" AND startsAt in the past), so a
    //     rescheduled future session never shows as Missed.
    const isOnboarding =
      m.weekNumber <= 0 && /onboarding/i.test(m.title);
    // Use the backend's pre-computed sessionAttended which checks ALL sessions
    // for the module. Falling back to the primary session's myAttendance would
    // miss attendance when a newer upcoming session shadows a past attended one.
    let sessionAttended: boolean | null = null;
    let sessionEnded = false;
    if (isOnboarding) {
      sessionAttended = true;
      sessionEnded = true;
    } else if (m.sessionAttended) {
      sessionAttended = true;
      sessionEnded = true;
    } else if (m.session) {
      const myAttStatus = m.session.myAttendance?.status ?? null;
      sessionEnded =
        m.session.status === "ended" &&
        new Date(m.session.startsAt).getTime() < Date.now();
      if (myAttStatus === "excused") {
        sessionAttended = true;
      } else if (sessionEnded && (myAttStatus === "missed" || myAttStatus === null)) {
        sessionAttended = false;
      }
    }

    const hasVideoContent =
      m.lessons.some((l) => l.kind === "video") ||
      m.resources.some((r) => r.kind === "video");
    const hasAnyContent =
      m.lessons.length > 0 || m.resources.length > 0;
    const contentLabel: FellowModuleSummary["contentLabel"] = !hasAnyContent
      ? null
      : hasVideoContent
      ? "Re-watch"
      : "Re-read";

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
      sessionAttended,
      sessionEnded,
      assessmentPassed: passed ? true : failed ? false : null,
      assessmentScore: my.bestScore,
      hasAssessment,
      durationMinutes: m.durationMinutes,
      contentLabel,
    };
  });
}

function mapBackendCurriculumModule(
  m: BackendCurriculumModule,
): FellowModuleDetail {
  const my = m.myAttempts;
  const passed = my.bestStatus === "passed";
  const failed = my.bestStatus === "failed";
  const isCompleted = m.sessionAttended || (passed && m.feedbackSubmitted);
  let status: FellowModuleSummary["status"];
  if (!m.unlocked) status = "locked";
  else if (isCompleted) status = "completed";
  else if (my.attemptsUsed > 0) status = "in-progress";
  else status = "available";

  // Orientation (Week 0): always reads as completed. Matches the
  // list view's treatment so the detail page and curriculum index
  // stay in lockstep.
  if (m.weekNumber <= 0) status = "completed";

  const lessons: Lesson[] = m.lessons.map((l) => {
    let lessonStatus: Lesson["status"];
    if (status === "completed" || l.completedAt) {
      lessonStatus = "completed";
    } else if (l.watchedSeconds > 0) {
      lessonStatus = "in-progress";
    } else {
      lessonStatus = "not-started";
    }
    return {
      id: l.id,
      title: l.title,
      summary: l.summary,
      kind: l.kind,
      durationMinutes: l.durationMinutes,
      status: lessonStatus,
      watchedSeconds: l.watchedSeconds,
      completedAt: l.completedAt ?? null,
      contentUrl: l.contentUrl ?? null,
      contentMimeType: l.contentMimeType ?? null,
      assessment: l.assessment ? mapBackendAssessment(l.assessment, my) : null,
    };
  });

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
    // Onboarding was conducted outside the LMS — every fellow is
    // credited regardless of the underlying attendance row. Force
    // sessionAttended to true so the path chip on the module header
    // reads "Attended" instead of "Upcoming". Mirrors the SessionCard's
    // title-matched gate so non-Onboarding Week 0 modules keep the
    // real attendance value.
    sessionAttended:
      m.weekNumber <= 0 && /onboarding/i.test(m.title)
        ? true
        : session.attended,
    sessionEnded:
      m.weekNumber <= 0 && /onboarding/i.test(m.title)
        ? true
        : session.status === "ended",
    assessmentPassed: passed ? true : failed ? false : null,
    assessmentScore: my.bestScore,
    hasAssessment,
    durationMinutes: m.durationMinutes,
    contentLabel:
      m.lessons.length === 0 && m.resources.length === 0
        ? null
        : m.lessons.some((l) => l.kind === "video") || m.resources.some((r) => r.kind === "video")
        ? "Re-watch"
        : "Re-read",
    lessons,
    session,
    resources,
    feedbackSubmitted: m.feedbackSubmitted ?? false,
    preAssessment: m.preAssessment ? mapBackendAssessment(m.preAssessment, my) : null,
    postAssessment: m.postAssessment ? mapBackendAssessment(m.postAssessment, my) : null,
  };
}

/** Detail view for `/learning/[week]`.
 *  Returns null when the week number isn't in the curriculum (→ 404).
 *  Throws when the backend is unreachable (→ error.tsx boundary). */
export async function getFellowModuleServer(
  week: number,
): Promise<FellowModuleDetail | null> {
  const real = await fetchCurriculum();
  if (!real) throw new Error("Could not load module — please try again.");
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

/** Full cohort sessions list for `/my-sessions`. Empty when backend unreachable.
 *
 * Onboarding (Week 0 module titled /onboarding/i) doesn't get its own
 * Zoom session record in the backend — orientation was conducted
 * outside the LMS. To keep the Past sessions table visible (and the
 * attendance stats honest), we fetch the curriculum alongside and
 * inject a synthetic "Attended" row whenever the cohort has an
 * Onboarding module but no corresponding session in the listing.
 */
export async function getFellowSessionsServer() {
  // backendFetch retries idempotent GETs and throws after exhausting them;
  // we let that propagate so the route's error.tsx shows a retry state
  // instead of silently rendering an empty/short session list. fetchCurriculum
  // is best-effort (it null-guards internally) — it only enriches the list
  // with the synthetic Onboarding row, so a curriculum hiccup degrades that
  // one row rather than failing the whole page.
  const [sessionsRes, curriculum] = await Promise.all([
    backendFetch("/me/sessions", { method: "GET" }),
    fetchCurriculum(),
  ]);
  if (!sessionsRes.ok) {
    throw new Error("Could not load your sessions — please try again.");
  }
  const data = (await sessionsRes.json()) as { sessions: BackendListedSession[] };
  const sessions = (data.sessions ?? []).map(mapBackendListedSession);

  if (curriculum) {
    const onboarding = curriculum.find(
      (m) => m.weekNumber <= 0 && /onboarding/i.test(m.title),
    );
    const alreadyListed = sessions.some(
      (s) => s.weekNumber <= 0 && /onboarding/i.test(s.moduleTitle),
    );
    if (onboarding && !alreadyListed) {
      sessions.push(synthOnboardingSession(onboarding));
    }
  }

  return sessions;
}

/** Build a synthetic "past attended" session row for the Onboarding
 *  module so /my-sessions has a Past row to render. Date/host fields
 *  carry placeholder values — the PastSessionsTable renders "Closed"
 *  in their place for orientation rows. */
function synthOnboardingSession(m: BackendCurriculumModule): FellowSession {
  // Anchor the row ~1 hour in the past so it sorts to the top of the
  // Past bucket and out of Upcoming. The PastSessionsTable suppresses
  // the actual date string in favour of "Closed" for orientation, so
  // this timestamp is never user-visible.
  const startsAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  return {
    id: null,
    title: m.title,
    weekNumber: m.weekNumber,
    moduleTitle: m.title,
    status: "ended",
    startsAt,
    durationMinutes: m.durationMinutes || 90,
    hostName: "PIC",
    rsvpd: true,
    attended: true,
    attendanceState: "attended",
    hasRecording: false,
    recordingDurationSeconds: null,
    recordingWatchedSeconds: 0,
    joinUrl: "#",
    attendanceThresholdMinutes: 0,
    joinedAt: null,
  };
}

type BackendListedSession = BackendSession & {
  module: { id: string; title: string; weekNumber: number } | null;
};

function mapBackendListedSession(b: BackendListedSession): FellowSession {
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
  // Session is "actually past" only when BOTH the DB status reads
  // "ended" AND the wall-clock start time is in the past. Guards
  // against the data-inconsistency case where a session's date got
  // moved forward but the status / attendance row still carry values
  // from its previous schedule. Without this, a future session can
  // read as "Missed" on the past-sessions table.
  const sessionEnded =
    status === "ended" && new Date(b.startsAt).getTime() < Date.now();
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
    // Only flip `attended` to false ("Missed") when the session has
    // actually ended. A leftover "missed" attendance row from a
    // previously-scheduled-then-rescheduled session would otherwise
    // bleed into an upcoming session and surface as "Missed" on a
    // session the fellow hasn't even had a chance to attend yet.
    attended:
      myStatus === "attended" || myStatus === "attended_recording" || myStatus === "excused"
        ? true
        : myStatus === "missed" && sessionEnded
        ? false
        : null,
    attendanceState: mapAttendanceState(myStatus, sessionEnded),
    hasRecording: Boolean(b.hasRecording),
    recordingDurationSeconds: b.recordingDurationSeconds ?? null,
    recordingWatchedSeconds: b.myAttendance?.recordingWatchedSeconds ?? 0,
    joinUrl: b.joinUrl ?? "#",
    attendanceThresholdMinutes: b.attendanceThresholdMinutes,
    joinedAt: b.myAttendance?.joinedAt ?? null,
  };
}

/** Map the backend's per-fellow attendance state to the UI's display
 *  state. The `missed` enum value is only honoured when the session
 *  has actually ended — see comment above for why. */
function mapAttendanceState(
  status: string | null,
  sessionEnded: boolean,
): ModuleSession["attendanceState"] {
  if (status === "attended") return "attended";
  if (status === "attended_recording") return "attended_recording";
  if (status === "excused") return "excused";
  if (status === "missed" && sessionEnded) return "missed";
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
  // Same clamp as mapBackendListedSession — only treat as ended when
  // both the DB status and the calendar agree, so a rescheduled
  // future session never reads as Missed.
  const sessionEnded =
    status === "ended" && new Date(b.startsAt).getTime() < Date.now();
  return {
    id: b.id,
    title: b.title,
    status,
    startsAt: b.startsAt,
    durationMinutes: b.durationMinutes,
    hostName: b.host?.fullName ?? "TBD",
    rsvpd: Boolean(b.myAttendance),
    // Same clamp as mapBackendListedSession: only honour "missed" once
    // the session has actually ended, so a future session never reads
    // as Missed on the module page's Live-session chip.
    attended:
      myStatus === "attended" || myStatus === "attended_recording" || myStatus === "excused"
        ? true
        : myStatus === "missed" && sessionEnded
        ? false
        : null,
    attendanceState: mapAttendanceState(myStatus, sessionEnded),
    hasRecording: Boolean(b.hasRecording),
    recordingDurationSeconds: b.recordingDurationSeconds ?? null,
    recordingWatchedSeconds: b.myAttendance?.recordingWatchedSeconds ?? 0,
    joinUrl: b.joinUrl ?? "#",
  };
}
