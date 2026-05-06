/**
 * Fellow learning — public types (BRD §6.3, §6.4). Reads run through
 * `fellow-learning.server.ts` (`GET /me/curriculum`, `GET /me/sessions`).
 */

export type ModuleStatus = "completed" | "in-progress" | "available" | "locked";

export type FellowModuleSummary = {
  weekNumber: number;
  title: string;
  summary: string;
  status: ModuleStatus;
  progressPercent: number;
  /** Did the fellow attend that week's live session? null = upcoming. */
  sessionAttended: boolean | null;
  /** Did the fellow pass the assessment? null = not attempted. */
  assessmentPassed: boolean | null;
  assessmentScore: number | null;
  /** Total study time across lessons + session, in minutes. */
  durationMinutes: number;
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
  /** Public URL to the uploaded content. Null when faculty hasn't
      attached anything yet — viewer falls back to an empty state. */
  contentUrl: string | null;
  contentMimeType: string | null;
};

export type ModuleSession = {
  /** Real backend session id. Null for the mock fallback. Required to embed
   *  the in-app Zoom meeting (used to mint a Meeting SDK signature). */
  id: string | null;
  /** Session status as of now. */
  status: "upcoming" | "live" | "ended" | "cancelled";
  /** ISO timestamp. */
  startsAt: string;
  durationMinutes: number;
  hostName: string;
  /** Whether the fellow has RSVP'd. */
  rsvpd: boolean;
  /** Final attendance state once the session is over. null until ended. */
  attended: boolean | null;
  /**
   * Zoom join URL — fallback when in-app embedding can't be used (e.g.,
   * `zoomMeetingId` not configured on the session). The Component View
   * embed inside the LMS is the primary path; this is the escape hatch.
   */
  joinUrl: string;
};

export type ModuleAssessment = {
  id: string;
  /** Real backend module id — used to navigate to /assessments/:moduleId/take. */
  moduleId: string;
  title: string;
  timeLimitMinutes: number;
  attemptsAllowed: number;
  attemptsUsed: number;
  passingScore: number;
  status: "not-started" | "in-progress" | "passed" | "failed";
  bestScore: number | null;
  attemptedAt: string | null;
};

export type ModuleResource = {
  id: string;
  title: string;
  kind: "pdf" | "link" | "video";
  url: string;
};

export type FellowModuleDetail = FellowModuleSummary & {
  /** Real backend module id — null for mock-only modules. Required to
   *  POST end-of-module feedback. */
  id: string | null;
  lessons: Lesson[];
  session: ModuleSession;
  assessment: ModuleAssessment;
  resources: ModuleResource[];
  /**
   * Whether the fellow has submitted end-of-module feedback. When false
   * AND completion is met (session attended OR assessment passed), the
   * fellow sees the feedback form; submitting it unlocks the next module.
   */
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
};

