/**
 * Server-only fellow capstone fetcher (BRD §6.10). Maps the backend
 * response into the existing rich `FellowCapstone` shape. Fields the
 * backend doesn't yet model (milestones, consultations, assignments,
 * mentor expertise summary) ship empty.
 */
import "server-only";
import { backendFetch } from "./backend";
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

const EMPTY_DRAFT = {
  problem: "",
  approach: "",
  stakeholders: "",
  deliverables: "",
  risks: "",
  lastSavedAt: new Date().toISOString(),
};

const EMPTY_CAPSTONE: FellowCapstone = {
  status: "not-started",
  title: "Untitled capstone",
  oneliner: "Start by defining your problem statement.",
  sector: "Economic Inclusion Development",
  mentor: EMPTY_MENTOR,
  draft: EMPTY_DRAFT,
  milestones: [],
  consultations: [],
  feedback: [],
  assignments: [],
  submittedAt: null,
  approvedAt: null,
  artifactUrl: null,
};

export async function getFellowCapstoneServer(): Promise<FellowCapstone> {
  try {
    const res = await backendFetch("/me/capstone", { method: "GET" });
    if (!res.ok) return EMPTY_CAPSTONE;
    const data = (await res.json()) as { capstone: BackendCapstone };
    return mapBackendCapstone(data.capstone);
  } catch {
    return EMPTY_CAPSTONE;
  }
}

function mapBackendCapstone(b: BackendCapstone): FellowCapstone {
  return {
    status: mapStatus(b.status),
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
    draft: {
      problem: b.problemStatement,
      approach: b.content,
      stakeholders: "",
      deliverables: "",
      risks: "",
      lastSavedAt: b.updatedAt,
    },
    milestones: b.milestones ?? [],
    consultations: [],
    feedback: b.feedback.map(mapFeedback),
    assignments: [],
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

export function mapSector(s: string | null): CapstoneSector | null {
  if (!s) return null;
  const norm = s.toLowerCase();
  if (norm.includes("health")) return "Healthcare";
  if (norm === "edtech" || norm.includes("educat")) return "Education";
  if (norm.includes("agric")) return "Agriculture";
  // Fintech, governance, public-policy, financial-inclusion all
  // collapse into "Economic Inclusion Development" — the LMS now
  // uses a single sector for these adjacent areas.
  return "Economic Inclusion Development";
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
