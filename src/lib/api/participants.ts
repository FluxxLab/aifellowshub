/**
 * Participants — admin user-management types (BRD §6.2). The aggregate
 * list endpoint isn't on the backend yet, so reads return empty until a
 * `GET /users` admin endpoint lands.
 */

export type Sector =
  | "Healthcare"
  | "Education"
  | "Agriculture"
  | "Economic Inclusion Development";

export type FellowStatus = "active"| "at-risk"| "inactive";

export type AssignedMentor = {
  id: string;
  fullName: string;
};

/**
 * Generic user profile shape returned by GET /admin/users/:id. Same
 * baseline fields for every role; `stats` carries role-specific
 * extensions used by /participants/:id when the user isn't a fellow.
 */
export type UserRole =
  | "fellow"
  | "mentor"
  | "faculty"
  | "admin"
  | "super_admin";

export type UserProfileStats =
  | {
      kind: "mentor";
      assignedFellowsCount: number;
      pendingReviewsCount: number;
      bookingsCount: number;
    }
  | {
      kind: "faculty";
      ownedModulesCount: number;
      draftModulesCount: number;
    }
  | {
      kind: "admin";
      lastActiveAt: string | null;
    }
  | { kind: "fellow" };

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  country: string | null;
  organisation: string | null;
  jobTitle: string | null;
  sector: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  isActive: boolean;
  joinedAt: string;
  stats: UserProfileStats | null;
};

export type Fellow = {
  id: string;
  fullName: string;
  email: string;
  country: string;
  organisation: string;
  jobTitle: string;
  /** Normalized sector label, or null when the profile has no sector set.
   *  Null matters: a sector-less fellow can't auto-match a mentor, so the
   *  UI must show "No sector" rather than mask it with a default. */
  sector: Sector | null;
  /** Mentor full name, or null if unassigned. Kept as a plain string for
   *  the list view; the detail view uses `assignedMentor` for actions. */
  mentor: string | null;
  progressPercent: number;
  attendanceRate: number;
  status: FellowStatus;
  /** Login-level activity (set false by admin soft-delete). Distinct from
   *  the fellow `status` enum, which is a programme-progress signal. */
  isActive: boolean;
  joinedAt: string; // ISO date
};

export type Mentor = {
  id: string;
  fullName: string;
  email: string;
  expertise: Sector[];
  assignedFellowsCount: number;
  pendingReviewsCount: number;
  isActive: boolean;
  joinedAt: string;
};

export type Faculty = {
  id: string;
  fullName: string;
  email: string;
  expertise: Sector[];
  /** Number of modules this faculty member owns / authors. */
  ownedModulesCount: number;
  /** Number of modules still in draft (not yet published). */
  draftModulesCount: number;
  isActive: boolean;
  joinedAt: string;
};

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: "super_admin"| "admin";
  lastActiveAt: string;
  isActive: boolean;
  joinedAt: string;
};

export type WaitlistEntry = {
  id: string;
  fullName: string;
  email: string;
  /** 1-based position in queue */
  position: number;
  appliedAt: string;
};

export type Participants = {
  fellows: Fellow[];
  faculty: Faculty[];
  mentors: Mentor[];
  admins: AdminUser[];
  waitlist: WaitlistEntry[];
};

export async function getParticipants(): Promise<Participants> {
  return { fellows: [], faculty: [], mentors: [], admins: [], waitlist: [] };
}

/* ---------- Detailed fellow profile (BRD §6.2 fellow profile view) ---------- */

export type ModuleStatus = "completed"| "in-progress"| "locked";

export type ModuleProgressEntry = {
  weekNumber: number;
  title: string;
  status: ModuleStatus;
};

export type SessionAttendance = {
  id: string;
  weekNumber: number;
  moduleTitle: string;
  date: string; // ISO
  status: "attended"| "excused"| "missed";
};

export type AssessmentScore = {
  id: string;
  weekNumber: number;
  title: string;
  score: number; // 0-100
  passed: boolean;
  attemptedAt: string;
};

export type CapstoneSnapshot = {
  status: "not-started"| "draft"| "submitted"| "under-review"| "approved";
  title: string | null;
  submittedAt: string | null;
  lastFeedback: string | null;
};

export type ActivityEntry = {
  id: string;
  type: "joined"| "module-complete"| "session-attended"| "session-missed"| "assessment-passed"| "capstone-submitted";
  message: string;
  at: string;
};

export type FellowProfile = Fellow & {
  bio: string | null;
  linkedinUrl: string | null;
  /** Currently resolved mentor (override → sector fallback). Null when
   *  no override is set and no sector mentor exists. */
  assignedMentor: AssignedMentor | null;
  /** True when an admin has explicitly pinned a mentor for this fellow. */
  hasMentorOverride: boolean;
  modules: ModuleProgressEntry[];
  recentSessions: SessionAttendance[];
  assessments: AssessmentScore[];
  capstone: CapstoneSnapshot;
  activity: ActivityEntry[];
};

export async function getFellowProfile(
  _id: string,
): Promise<FellowProfile | null> {
  return null;
}
