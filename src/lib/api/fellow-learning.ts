/**
 * Fellow learning — public types (BRD §6.3, §6.4). Reads run through
 * `fellow-learning.server.ts` (`GET /me/curriculum`, `GET /me/sessions`).
 */

export type ModuleStatus = "completed" | "in-progress" | "available" | "locked";

export type FellowModuleSummary = {
  weekNumber: number;
  title: string;
  summary: string;
  /** Longer prose intro authored by faculty. Null when not set; UI
   *  falls back to `summary` for the overview section. */
  overview: string | null;
  /** Newline-separated bullet objectives. Frontend splits on \n. */
  learningObjectives: string | null;
  /** Tag chips. Empty array when none set. */
  keywords: string[];
  status: ModuleStatus;
  progressPercent: number;
  /** Did the fellow attend that week's live session? null = upcoming. */
  sessionAttended: boolean | null;
  /** True when the session has already ended (past its scheduled window).
   *  Combines with sessionAttended===null to show "Catch up" instead of "Upcoming". */
  sessionEnded: boolean;
  /** Did the fellow pass the assessment? null = not attempted. */
  assessmentPassed: boolean | null;
  assessmentScore: number | null;
  /** True when the module carries at least one assessment (pre / post
   *  / lesson-level). Drives whether the curriculum list shows the
   *  Assessment chip — orientation-style weeks without any quiz hide
   *  the chip entirely so fellows don't see a permanently-pending
   *  control with nothing to do about it. */
  hasAssessment: boolean;
  /** Total study time across lessons + session, in minutes. */
  durationMinutes: number;
  /**
   * Label for the re-access button on completed modules.
   * "Re-watch" when the module has video content, "Re-read" when it has
   * only readings/docs, null when the module has no lessons or resources
   * (e.g. Onboarding — no button should be shown).
   */
  contentLabel: "Re-watch" | "Re-read" | null;
};

export type LessonKind = "reading" | "video" | "exercise";
export type LessonStatus = "completed" | "in-progress" | "not-started";

export type Lesson = {
  id: string;
  title: string;
  summary: string;
  kind: LessonKind;
  durationMinutes: number;
  status: LessonStatus;
  /** Cumulative seconds the fellow has watched (0 if never opened). */
  watchedSeconds: number;
  /** ISO timestamp when the fellow first crossed the 90% watch threshold. Null if not yet. */
  completedAt: string | null;
  /** Public URL to the uploaded content. Null when faculty hasn't
      attached anything yet — viewer falls back to an empty state. */
  contentUrl: string | null;
  contentMimeType: string | null;
  /**
   * Optional mentor-authored quiz attached to this lesson. Fellow takes
   * it inline. Score is visible (kind=lesson). Submitting/passing it
   * counts toward the next-module unlock cascade.
   */
  assessment: ModuleAssessment | null;
};

export type ModuleSession = {
  /** Real backend session id. Null when the module has no scheduled session
   *  yet (a placeholder card is shown). Required to embed the in-app Zoom
   *  meeting (used to mint a Meeting SDK signature). */
  id: string | null;
  /** Admin-set session title (Zoom meeting name) — what the fellow sees
   *  as the bold heading on session cards. Falls back to the module
   *  title when the admin didn't customize. */
  title: string;
  /** Session status as of now. */
  status: "upcoming" | "live" | "ended" | "cancelled";
  /** ISO timestamp. */
  startsAt: string;
  durationMinutes: number;
  hostName: string;
  /** Whether the fellow has registered (RSVP'd). */
  rsvpd: boolean;
  /**
   * Final attendance state once the session is over. null until ended.
   * Live attendance and recording-watched are both truthy here; use
   * `attendanceState` to distinguish the two for half-credit display.
   */
  attended: boolean | null;
  /**
   * Richer attendance state. "attended" = full credit (live), "attended_recording"
   * = half credit (caught up via recording), "excused" = admin-granted full credit,
   * "missed" = no credit, null = pending.
   */
  attendanceState: "attended" | "attended_recording" | "excused" | "missed" | null;
  /** True once the session's recording has been archived to DO Spaces. */
  hasRecording: boolean;
  /** Total length of the recording, in seconds. Null if no recording yet. */
  recordingDurationSeconds: number | null;
  /** Cumulative seconds the fellow has already watched of this recording. */
  recordingWatchedSeconds: number;
  /**
   * Zoom join URL — fallback when in-app embedding can't be used (e.g.,
   * `zoomMeetingId` not configured on the session). The Component View
   * embed inside the LMS is the primary path; this is the escape hatch.
   */
  joinUrl: string;
};

/** Tiered assessment kinds (BRD §6.5 + tiered extension). */
export type AssessmentKind = "pre" | "lesson" | "post";

export type ModuleAssessment = {
  id: string;
  /** Real backend module id — used to navigate to /assessments/:moduleId/take. */
  moduleId: string;
  /** Set only when kind === "lesson" — the lesson this quiz is attached to. */
  lessonId: string | null;
  /** Which tier this assessment is. Drives UI grouping and score visibility. */
  kind: AssessmentKind;
  title: string;
  timeLimitMinutes: number;
  attemptsAllowed: number;
  attemptsUsed: number;
  passingScore: number;
  status: "not-started" | "in-progress" | "passed" | "failed" | "submitted";
  bestScore: number | null;
  attemptedAt: string | null;
  /**
   * True for pre/post — UI must hide score, pass/fail indicators, and the
   * passingScore threshold. The fellow only sees "Submitted ✓" or "Not yet".
   * Diagnostic by design (BRD §6.5 extension).
   */
  hideScore: boolean;
};

export type ModuleResource = {
  id: string;
  title: string;
  kind: "pdf" | "link" | "video";
  url: string;
};

export type FellowModuleDetail = FellowModuleSummary & {
  /** Real backend module id. Required to POST end-of-module feedback. */
  id: string;
  lessons: Lesson[];
  session: ModuleSession;
  /**
   * Tiered assessments. The legacy `assessment` field is removed —
   * consumers should render `preAssessment`, lesson-level quizzes
   * (embedded on each `Lesson.assessment`), and `postAssessment`.
   */
  preAssessment: ModuleAssessment | null;
  postAssessment: ModuleAssessment | null;
  resources: ModuleResource[];
  /**
   * Whether the fellow has submitted end-of-module feedback. When false
   * AND `feedbackEligible`, the fellow sees the feedback form; submitting
   * it unlocks the next module.
   */
  feedbackSubmitted: boolean;
  /**
   * Whether the fellow can leave end-of-module feedback yet. Looser than
   * `sessionAttended` — true once they've attended a session OR passed the
   * assessment, without waiting for a multi-session week's later sessions.
   */
  feedbackEligible: boolean;
  /**
   * Every session of this module, with the fellow's attendance + feedback
   * state — drives the per-session feedback prompts on the module page.
   */
  feedbackSessions: ModuleSessionFeedbackInfo[];
};

/** One session's feedback state for the module page's per-session prompts. */
export type ModuleSessionFeedbackInfo = {
  id: string;
  title: string;
  startsAt: string;
  /** Attended live / via recording / excused — gates whether feedback shows. */
  attended: boolean;
  feedbackSubmitted: boolean;
};

/** End-of-module feedback the fellow submits once per module. */
export type ModuleFeedback = {
  id: string;
  overallRating: number;
  contentRating: number;
  sessionRating: number;
  mentorRating: number;
  whatWorked: string | null;
  whatDidnt: string | null;
  submittedAt: string;
};

/** A session as the fellow sees it — module context attached. */
export type FellowSession = ModuleSession & {
  weekNumber: number;
  moduleTitle: string;
  /**
   * Auto-credit threshold for this session — minutes the fellow must stay in
   * the Zoom meeting (BRD §6.4 default = 50% of duration).
   */
  attendanceThresholdMinutes: number;
  /** ISO timestamp of when this fellow first joined, null if never joined. */
  joinedAt: string | null;
  /** Whether the fellow has already submitted feedback for this session.
   *  Drives the per-session "Give feedback" / "Feedback submitted" control. */
  feedbackSubmitted: boolean;
};

