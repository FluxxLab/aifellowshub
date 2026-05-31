/**
 * Live sessions — admin overview types (BRD §6.4). The aggregate list
 * endpoint isn't aggregated on the backend yet (per-session reads run
 * through `sessions.server.ts`). Returns empty until a list endpoint
 * lands.
 */

export type SessionStatus = "scheduled"| "live"| "ended"| "cancelled";

export type LiveSession = {
  id: string;
  weekNumber: number;
  moduleTitle: string;
  title: string;
  hostId: string;
  hostName: string;
  /**
   * Faculty members delivering the session. Empty array when admin
   * runs the session themselves (orientation, summit); multiple
   * entries for panel discussions. Distinct from `host` — the host
   * owns the Zoom meeting, teachers show up to teach.
   */
  teachers: { id: string; fullName: string }[];
  /** ISO timestamp */
  scheduledStart: string;
  /** ISO timestamp */
  scheduledEnd: string;
  durationMinutes: number;
  status: SessionStatus;
  rsvpCount: number;
  /** Number of fellows credited as attended. Only set for ended sessions. */
  attendedCount?: number;
  /** Total fellows expected (cohort enrolled count). */
  expectedCount: number;
  /** Minimum minutes in room to be auto-credited (BRD §6.4 default = 50% of duration). */
  attendanceThresholdMinutes: number;
  /** True once the recording has been pulled from Zoom into DO Spaces. */
  hasRecording: boolean;
};

export async function getSessions(): Promise<LiveSession[]> {
  return [];
}

/* ---------- Session detail (attendance roster, BRD §6.4) ---------- */

export type AttendanceOverride = "attended"| "excused";

export type AttendanceRecord = {
  fellowId: string;
  fellowName: string;
  /** ISO timestamp the fellow joined the Zoom meeting. Null = never joined. */
  joinedAt: string | null;
  /** ISO timestamp the fellow left. Null while still in the meeting or never joined. */
  leftAt: string | null;
  /** True when the fellow has joined but not yet left (session is live). */
  inSession: boolean;
  totalMinutesPresent: number;
  /** True if the fellow crossed the auto-credit threshold (BRD §6.4). */
  autoCredited: boolean;
  /** Admin override, if any, that supersedes the auto-credit decision. */
  override: AttendanceOverride | null;
  /** Seconds of recording the fellow has watched (0 if never opened). */
  recordingWatchedSeconds: number;
  /** ISO timestamp when recording half-credit was awarded, or null. */
  recordingCreditedAt: string | null;
  /** Number of forward skips (>5 s) detected across all watch sessions. */
  recordingSkipCount: number;
};

export type SessionDetail = LiveSession & {
  attendance: AttendanceRecord[];
  /** Zoom join URL — null when the meeting hasn't been provisioned yet
   *  (Zoom credentials missing, or the session was created before the
   *  Zoom integration landed). Drives the "Start session" CTA. */
  joinUrl: string | null;
  /** Numeric Zoom meeting id, as a string. Lets the UI deep-link or
   *  show diagnostics; webhook events match against this. */
  zoomMeetingId: string | null;
};

export async function getSession(_id: string): Promise<SessionDetail | null> {
  return null;
}
