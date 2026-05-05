/**
 * Fellow capstone — public interface (BRD §6.10).
 *
 * Reads go through the server fetcher (`fellow-capstone.server.ts`); this
 * file holds the public types + client-safe mutators that the view calls
 * on save / submit. Server-only helpers must NOT be imported here.
 */
import { apiFetch } from "./client";

export type CapstoneStatus =
  | "not-started"
  | "draft"
  | "submitted"
  | "under-review"
  | "approved"
  | "returned";

export type CapstoneSector =
  | "Health AI"
  | "EdTech"
  | "Agriculture"
  | "Fintech"
  | "Governance"
  | "Other";

export type CapstoneMentor = {
  id: string;
  fullName: string;
  email: string;
  expertiseSummary: string;
};

export type CapstoneDraft = {
  /** Problem statement — what is the harm or governance gap? */
  problem: string;
  /** Approach — how will you address it? Method, framework, deliverable type. */
  approach: string;
  /** Stakeholder list (one per line). */
  stakeholders: string;
  /** Concrete deliverables — what will exist at the end? */
  deliverables: string;
  /** Risks, limitations, what could go wrong. */
  risks: string;
  /** ISO timestamp the fellow last saved. */
  lastSavedAt: string;
};

export type CapstoneMilestoneStatus = "complete" | "in-progress" | "pending" | "overdue";

export type CapstoneMilestone = {
  id: string;
  title: string;
  weekNumber: number;
  dueAt: string;
  status: CapstoneMilestoneStatus;
};

export type StakeholderConsultation = {
  id: string;
  stakeholderName: string;
  stakeholderRole: string;
  scheduledAt: string;
  /** "scheduled" before, "complete" after, "cancelled" if pulled. */
  status: "scheduled" | "complete" | "cancelled";
  notes: string | null;
};

export type CapstoneFeedbackEntry = {
  id: string;
  /** Mentor or the fellow themselves replying on the thread. */
  fromMentor: boolean;
  fromName: string;
  message: string;
  at: string;
};

export type CapstoneAssignmentStatus = "pending" | "completed";

export type CapstoneAssignment = {
  id: string;
  title: string;
  description: string;
  assignedBy: {
    id: string;
    name: string;
  };
  assignedAt: string;
  /** ISO date the fellow needs to deliver by; null = no fixed deadline. */
  dueAt: string | null;
  status: CapstoneAssignmentStatus;
  /** ISO timestamp the fellow marked it done. Null until completed. */
  completedAt: string | null;
};

export type FellowCapstone = {
  status: CapstoneStatus;
  title: string;
  oneliner: string;
  sector: CapstoneSector;
  mentor: CapstoneMentor;
  draft: CapstoneDraft;
  milestones: CapstoneMilestone[];
  consultations: StakeholderConsultation[];
  feedback: CapstoneFeedbackEntry[];
  assignments: CapstoneAssignment[];
  /** ISO timestamp — null until the fellow submits draft v1. */
  submittedAt: string | null;
  /** ISO timestamp — null until mentor approves. */
  approvedAt: string | null;
};


/* ---------- Client-side mutators (BRD §6.10) ---------- */

/**
 * Backend-shape returned from PATCH/POST endpoints. The view doesn't need
 * the full mock-merged shape after a write — just the canonical fields
 * that the backend owns. Mock-only fields (milestones, consultations,
 * assignments) stay untouched in component state.
 */
export type CapstoneMutationResult = {
  id: string;
  title: string;
  problemStatement: string;
  status: CapstoneStatus;
  stage: "scoping" | "design" | "consultation" | "final";
  lastSubmittedAt: string | null;
  finalApprovedAt: string | null;
  updatedAt: string;
};

type BackendCapstoneShape = {
  id: string;
  title: string;
  problemStatement: string;
  status: "draft" | "under_review" | "needs_revision" | "approved";
  stage: "scoping" | "design" | "consultation" | "final";
  lastSubmittedAt: string | null;
  finalApprovedAt: string | null;
  updatedAt: string;
};

function mapMutationResult(c: BackendCapstoneShape): CapstoneMutationResult {
  return {
    id: c.id,
    title: c.title,
    problemStatement: c.problemStatement,
    status:
      c.status === "draft"
        ? "draft"
        : c.status === "under_review"
        ? "under-review"
        : c.status === "needs_revision"
        ? "returned"
        : "approved",
    stage: c.stage,
    lastSubmittedAt: c.lastSubmittedAt,
    finalApprovedAt: c.finalApprovedAt,
    updatedAt: c.updatedAt,
  };
}

export type SaveCapstonePayload = {
  title: string;
  problemStatement: string;
  sector?: string;
  content?: string;
  draftUrl?: string;
  artifactUrl?: string;
  stage?: "scoping" | "design" | "consultation" | "final";
};

/** PATCH /me/capstone — save the fellow's draft. */
export async function saveFellowCapstone(
  payload: SaveCapstonePayload,
): Promise<CapstoneMutationResult> {
  const data = await apiFetch<{ capstone: BackendCapstoneShape }>(
    "/me/capstone",
    { method: "PATCH", body: payload },
  );
  return mapMutationResult(data.capstone);
}

/** POST /me/capstone/submit — flip status to under_review. */
export async function submitFellowCapstone(): Promise<CapstoneMutationResult> {
  const data = await apiFetch<{ capstone: BackendCapstoneShape }>(
    "/me/capstone/submit",
    { method: "POST" },
  );
  return mapMutationResult(data.capstone);
}

/* ---------- Mentor / admin review (BRD §6.10) ---------- */

export type ReviewOutcome = "comments" | "needs_revision" | "approved";

/** POST /capstones/:id/review — mentor or admin only. */
export async function reviewCapstone(
  capstoneId: string,
  payload: { outcome: ReviewOutcome; message: string },
): Promise<CapstoneMutationResult> {
  const data = await apiFetch<{ capstone: BackendCapstoneShape }>(
    `/capstones/${encodeURIComponent(capstoneId)}/review`,
    { method: "POST", body: payload },
  );
  return mapMutationResult(data.capstone);
}

/* ---------- Mentor side (BRD §6.10) ---------- */

export type MentorQueueEntry = {
  fellowId: string;
  fellowName: string;
  fellowEmail: string;
  fellowCountry: string;
  sector: CapstoneSector;
  capstoneTitle: string | null;
  status: CapstoneStatus;
  /** ISO timestamp of the last activity on the thread or draft. */
  lastActivityAt: string;
  /** True if the mentor hasn't replied since the last fellow update. */
  awaitingMentorReply: boolean;
  unreadFromFellow: number;
};


export type MentorActivityEntry = {
  id: string;
  fellowName: string;
  message: string;
  at: string;
};

export type MentorOfficeHours = {
  /** ISO timestamp of the next office-hours block. */
  startsAt: string;
  durationMinutes: number;
  rsvpCount: number;
  topic: string;
};

export type MentorHomeSummary = {
  /** Total assigned fellows. */
  fellowsAssigned: number;
  awaitingReply: number;
  submittedOrUnderReview: number;
  hoursMentoredThisWeek: number;
  averageFellowProgressPercent: number;
  averageFellowAttendancePercent: number;
  nextOfficeHours: MentorOfficeHours;
  recentActivity: MentorActivityEntry[];
};

/**
 * Mentor home metrics — backend doesn't aggregate this surface yet, so
 * the page renders a zero-state until a `/me/mentor-home` endpoint lands.
 */
export async function getMentorHome(): Promise<MentorHomeSummary> {
  return {
    fellowsAssigned: 0,
    awaitingReply: 0,
    submittedOrUnderReview: 0,
    hoursMentoredThisWeek: 0,
    averageFellowProgressPercent: 0,
    averageFellowAttendancePercent: 0,
    nextOfficeHours: {
      startsAt: new Date().toISOString(),
      durationMinutes: 60,
      rsvpCount: 0,
      topic: "—",
    },
    recentActivity: [],
  };
}
