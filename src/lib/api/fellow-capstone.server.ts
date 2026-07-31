/**
 * Server-only fellow capstone fetcher (BRD §6.10). Maps the backend
 * response into the existing rich `FellowCapstone` shape. Milestones and
 * feedback come from the backend; the mentor expertise summary isn't
 * modelled server-side yet and ships empty.
 */
import "server-only";
import { backendFetch } from "./backend";
import { normalizeSector } from "@/lib/sector";
import { capstoneSections } from "./fellow-capstone";
import type {
  CapstoneStatus,
  CapstoneSector,
  CapstoneFeedbackEntry,
  FellowCapstone,
} from "./fellow-capstone";

/**
 * Server-side mentor home aggregator. Hits the backend's
 * `/me/mentor-home` directly so the mentor page (a server component)
 * gets real data without trying to call the BFF from Node land.
 * Returns a zero-state envelope on transport failures so the page
 * still renders.
 */
export async function getMentorHomeServer(): Promise<{
  fellowsAssigned: number;
  awaitingReply: number;
  submittedOrUnderReview: number;
  hoursMentoredThisWeek: number;
  averageFellowProgressPercent: number;
  averageFellowAttendancePercent: number;
  recentActivity: { id: string; fellowName: string; message: string; at: string }[];
}> {
  const fallback = {
    fellowsAssigned: 0,
    awaitingReply: 0,
    submittedOrUnderReview: 0,
    hoursMentoredThisWeek: 0,
    averageFellowProgressPercent: 0,
    averageFellowAttendancePercent: 0,
    recentActivity: [],
  };
  try {
    const res = await backendFetch("/me/mentor-home", { method: "GET" });
    if (!res.ok) return fallback;
    return (await res.json()) as typeof fallback;
  } catch {
    return fallback;
  }
}

export type BackendCapstone = {
  id: string;
  title: string;
  problemStatement: string;
  sector: string | null;
  approach?: string;
  deliverables?: string;
  risks?: string;
  /** DEPRECATED — superseded by the three fields above; still sent in parallel. */
  content: string;
  draftUrl: string | null;
  artifactUrl: string | null;
  stage: "scoping" | "design" | "consultation" | "final";
  status: "draft" | "under_review" | "needs_revision" | "approved";
  milestones?: {
    id: string;
    title: string;
    status: "complete" | "in-progress" | "pending" | "overdue";
  }[];
  lastSubmittedAt: string | null;
  finalApprovedAt: string | null;
  fellow: {
    id: string;
    fullName: string;
    email: string;
    country: string | null;
    sector: string | null;
  } | null;
  mentor: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  feedback: BackendCapstoneFeedback[];
  createdAt: string;
  updatedAt: string;
};

export type BackendCapstoneFeedback = {
  id: string;
  stage: "scoping" | "design" | "consultation" | "final";
  outcome: "comments" | "needs_revision" | "approved";
  message: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    role: string;
  };
};

const EMPTY_MENTOR = {
  id: "",
  fullName: "Mentor not assigned",
  email: "",
  expertiseSummary: "Awaiting mentor assignment.",
};

export async function getFellowCapstoneServer(): Promise<FellowCapstone> {
  // Let failures propagate to the route's error.tsx (auto-retry + manual
  // button) instead of silently rendering an empty capstone. The old
  // EMPTY_CAPSTONE fallback made a mid-deploy blip look like the fellow's
  // capstone had been wiped — "Untitled capstone", no mentor, blank draft —
  // which is far scarier than an honest "couldn't load, retrying".
  // backendFetch already retries idempotent GETs before throwing.
  const res = await backendFetch("/me/capstone", { method: "GET" });
  if (!res.ok) {
    throw new Error("Could not load your capstone — please try again.");
  }
  const data = (await res.json()) as { capstone: BackendCapstone };
  return mapBackendCapstone(data.capstone);
}

function mapBackendCapstone(b: BackendCapstone): FellowCapstone {
  return {
    status: mapStatus(b.status),
    stage: b.stage,
    title: b.title,
    oneliner: firstLine(b.problemStatement) || "No problem statement yet.",
    // Fellow's profile sector is the source of truth; the capstone's own
    // sector column drifts (nulled on most saves), so prefer the profile.
    sector: mapSector(b.fellow?.sector ?? b.sector) ?? "Economic Inclusion Development",
    mentor: b.mentor
      ? {
          id: b.mentor.id,
          fullName: b.mentor.fullName,
          email: b.mentor.email,
          expertiseSummary: "",
        }
      : EMPTY_MENTOR,
    // Each section now has its own column, with the legacy `content` blob as
    // the fallback. The test has to be "do the columns actually hold
    // anything", NOT "are they defined": once the columns exist they come back
    // as empty strings, so a row the backfill hasn't reached yet would
    // otherwise render three blank boxes while its text sat safely in
    // `content`, reading to the fellow as lost work.
    draft: {
      problem: b.problemStatement,
      ...capstoneSections(b),
      stakeholders: "",
      lastSavedAt: b.updatedAt,
    },
    milestones: b.milestones ?? [],
    feedback: b.feedback.map(mapFeedback),
    submittedAt: b.lastSubmittedAt,
    approvedAt: b.finalApprovedAt,
    artifactUrl: b.artifactUrl ?? null,
  };
}

function mapStatus(s: BackendCapstone["status"]): CapstoneStatus {
  switch (s) {
    case "draft":
      return "draft";
    case "under_review":
      return "under-review";
    case "needs_revision":
      return "returned";
    case "approved":
      return "approved";
  }
}

// Kept as a thin re-export so existing callers (capstone.server) don't churn;
// the actual normalization lives in the shared `@/lib/sector` util so server
// mappers and client views can't drift.
export function mapSector(s: string | null): CapstoneSector | null {
  return normalizeSector(s);
}

function mapFeedback(f: BackendCapstoneFeedback): CapstoneFeedbackEntry {
  return {
    id: f.id,
    fromMentor: f.author.role !== "fellow",
    fromName: f.author.fullName,
    message: f.message,
    at: f.createdAt,
  };
}

function firstLine(text: string): string {
  const i = text.indexOf("\n");
  return (i === -1 ? text : text.slice(0, i)).trim();
}
