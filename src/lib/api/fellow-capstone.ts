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
  | "Healthcare"
  | "Education"
  | "Agriculture"
  | "Economic Inclusion Development";

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
  status: CapstoneMilestoneStatus;
  /** Optional — backend doesn't yet emit a per-cohort deadline. */
  weekNumber?: number;
  /** Optional — same as weekNumber. */
  dueAt?: string;
};

export type CapstoneFeedbackEntry = {
  id: string;
  /** Mentor or the fellow themselves replying on the thread. */
  fromMentor: boolean;
  fromName: string;
  message: string;
  at: string;
};

export type FellowCapstone = {
  status: CapstoneStatus;
  title: string;
  oneliner: string;
  sector: CapstoneSector;
  mentor: CapstoneMentor;
  draft: CapstoneDraft;
  milestones: CapstoneMilestone[];
  feedback: CapstoneFeedbackEntry[];
  /** ISO timestamp — null until the fellow submits draft v1. */
  submittedAt: string | null;
  /** ISO timestamp — null until mentor approves. */
  approvedAt: string | null;
  /** URL of the uploaded capstone document (Word or PDF). Null if not yet uploaded. */
  artifactUrl: string | null;
};


/* ---------- Client-side mutators (BRD §6.10) ---------- */

/**
 * Backend-shape returned from PATCH/POST endpoints. A write only needs the
 * canonical fields the backend owns; the view calls `router.refresh()`
 * afterwards to re-fetch milestones + feedback from the server (both are
 * backend-derived).
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

// A draft save is a partial update: send only what changed. Attaching a
// document sends just `artifactUrl`; a full form save sends everything.
// Omitted fields keep their stored value server-side. `title` /
// `problemStatement` are optional here (the backend only enforces them at
// submit), so an upload never has to re-supply a problem statement the
// fellow put inside the document.
export type SaveCapstonePayload = {
  title?: string;
  problemStatement?: string;
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

/**
 * DELETE /me/capstone — delete the fellow's own capstone. The server enforces
 * the policy (drafts any time; a submission only within 48h of submitting; an
 * approved capstone not at all) and throws with a message the caller shows.
 */
export async function deleteFellowCapstone(): Promise<void> {
  await apiFetch<{ deleted: boolean }>("/me/capstone", { method: "DELETE" });
}

/** POST /me/capstone/upload-url — mint a presigned PUT URL for a document upload. */
export async function getCapstoneUploadUrl(opts: {
  mimeType: string;
  bytes: number;
  filename: string;
}): Promise<{ uploadUrl: string; objectUrl: string }> {
  return apiFetch("/me/capstone/upload-url", {
    method: "POST",
    body: opts,
  });
}

/** POST /me/capstone/submit — flip status to under_review. */
export async function submitFellowCapstone(): Promise<CapstoneMutationResult> {
  const data = await apiFetch<{ capstone: BackendCapstoneShape }>(
    "/me/capstone/submit",
    { method: "POST" },
  );
  return mapMutationResult(data.capstone);
}

/**
 * POST /me/capstone/comment — fellow appends a message to the
 * capstone feedback thread. Backend persists a CapstoneFeedback row
 * with the fellow as author and notifies the assigned mentor.
 */
export async function postFellowCapstoneComment(
  message: string,
): Promise<void> {
  await apiFetch<{ capstone: unknown }>("/me/capstone/comment", {
    method: "POST",
    body: { message },
  });
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
  /** Null when the fellow has no sector set yet — UI should render "—". */
  sector: CapstoneSector | null;
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
 * Mentor home metrics. Falls back to a zero-state envelope when the
 * backend is unreachable so the page can still render.
 */
export async function getMentorHome(): Promise<MentorHomeSummary> {
  try {
    const data = await apiFetch<Omit<MentorHomeSummary, "nextOfficeHours">>(
      "/me/mentor-home",
    );
    return {
      ...data,
      // Office hours card was retired in favour of the confirmed-bookings
      // list — backend doesn't emit this field. Synthesise a sentinel
      // value so existing typings keep compiling until the prop is
      // removed from MentorHomeSummary itself.
      nextOfficeHours: {
        startsAt: new Date().toISOString(),
        durationMinutes: 0,
        rsvpCount: 0,
        topic: "",
      },
    };
  } catch {
    return EMPTY_MENTOR_HOME;
  }
}

const EMPTY_MENTOR_HOME: MentorHomeSummary = {
  fellowsAssigned: 0,
  awaitingReply: 0,
  submittedOrUnderReview: 0,
  hoursMentoredThisWeek: 0,
  averageFellowProgressPercent: 0,
  averageFellowAttendancePercent: 0,
  nextOfficeHours: {
    startsAt: new Date().toISOString(),
    durationMinutes: 0,
    rsvpCount: 0,
    topic: "",
  },
  recentActivity: [],
};

