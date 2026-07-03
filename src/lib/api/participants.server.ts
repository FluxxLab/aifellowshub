/**
 * Server-only admin participants fetcher (BRD §6.2). Maps backend
 * `GET /admin/participants` to the existing `Participants` shape the
 * page renders. Returns empty groups when the backend is unreachable.
 */
import "server-only";
import { redirect } from "next/navigation";
import { backendFetch } from "./backend";
import { sectorLabel } from "@/lib/sector";
import type {
  Faculty,
  Fellow,
  Mentor,
  Participants,
  Sector,
  AdminUser,
  FellowProfile,
  ModuleProgressEntry,
  SessionAttendance,
  CapstoneSnapshot,
  ActivityEntry,
  UserProfile,
} from "./participants";

type BackendFellow = {
  id: string;
  fullName: string;
  email: string;
  country: string;
  organisation: string;
  jobTitle: string;
  sector: string | null;
  mentorName: string | null;
  status: "active" | "at_risk" | "inactive" | null;
  isActive: boolean;
  progressPercent: number;
  attendanceRate: number;
  joinedAt: string;
};

type BackendMentor = {
  id: string;
  fullName: string;
  email: string;
  sector: string | null;
  assignedFellowsCount: number;
  pendingReviewsCount: number;
  isActive: boolean;
  joinedAt: string;
};

type BackendFaculty = {
  id: string;
  fullName: string;
  email: string;
  sector: string | null;
  ownedModulesCount: number;
  draftModulesCount: number;
  isActive: boolean;
  joinedAt: string;
};

type BackendAdmin = {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "super_admin";
  lastActiveAt: string;
  isActive: boolean;
  joinedAt: string;
};

type BackendResponse = {
  fellows: BackendFellow[];
  mentors: BackendMentor[];
  faculty: BackendFaculty[];
  admins: BackendAdmin[];
};

const EMPTY: Participants = {
  fellows: [],
  faculty: [],
  mentors: [],
  admins: [],
  waitlist: [],
};

export async function getParticipantsServer(): Promise<Participants> {
  try {
    const res = await backendFetch("/admin/participants", { method: "GET" });
    if (!res.ok) return EMPTY;
    const data = (await res.json()) as BackendResponse;
    return mapResponse(data);
  } catch {
    return EMPTY;
  }
}

function mapResponse(data: BackendResponse): Participants {
  return {
    fellows: data.fellows.map(mapFellow),
    mentors: data.mentors.map(mapMentor),
    faculty: data.faculty.map(mapFaculty),
    admins: data.admins.map(mapAdmin),
    waitlist: [],
  };
}

function mapFellow(f: BackendFellow): Fellow {
  return {
    id: f.id,
    fullName: f.fullName,
    email: f.email,
    country: f.country,
    organisation: f.organisation,
    jobTitle: f.jobTitle,
    sector: prettySector(f.sector),
    mentor: f.mentorName,
    progressPercent: f.progressPercent,
    attendanceRate: f.attendanceRate,
    status: f.status === "at_risk" ? "at-risk" : (f.status ?? "active"),
    isActive: f.isActive,
    joinedAt: f.joinedAt,
  };
}

function mapMentor(m: BackendMentor): Mentor {
  const sec = prettySector(m.sector);
  return {
    id: m.id,
    fullName: m.fullName,
    email: m.email,
    expertise: [sec],
    assignedFellowsCount: m.assignedFellowsCount,
    pendingReviewsCount: m.pendingReviewsCount,
    isActive: m.isActive,
    joinedAt: m.joinedAt,
  };
}

function mapFaculty(f: BackendFaculty): Faculty {
  const sec = prettySector(f.sector);
  return {
    id: f.id,
    fullName: f.fullName,
    email: f.email,
    expertise: [sec],
    ownedModulesCount: f.ownedModulesCount,
    draftModulesCount: f.draftModulesCount,
    isActive: f.isActive,
    joinedAt: f.joinedAt,
  };
}

function mapAdmin(a: BackendAdmin): AdminUser {
  return {
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    role: a.role,
    lastActiveAt: a.lastActiveAt,
    isActive: a.isActive,
    joinedAt: a.joinedAt,
  };
}

type BackendFellowProfile = {
  id: string;
  fullName: string;
  email: string;
  country: string | null;
  organisation: string | null;
  jobTitle: string | null;
  sector: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  status: "active" | "at_risk" | "inactive" | null;
  isActive: boolean;
  joinedAt: string;
  progressPercent: number;
  attendanceRate: number;
  mentor: { id: string; fullName: string } | null;
  mentorName: string | null;
  mentorOverrideId: string | null;
  modules: { weekNumber: number; title: string; status: ModuleProgressEntry["status"] }[];
  recentSessions: {
    id: string;
    weekNumber: number;
    moduleTitle: string;
    date: string;
    status: SessionAttendance["status"];
  }[];
  assessments: {
    id: string;
    weekNumber: number;
    title: string;
    score: number;
    passed: boolean;
    attemptedAt: string;
  }[];
  capstone: {
    status: "draft" | "under_review" | "needs_revision" | "approved";
    title: string | null;
    submittedAt: string | null;
    lastFeedback: string | null;
  };
  activity: { id: string; type: ActivityEntry["type"]; message: string; at: string }[];
};

/** Generic profile fetcher (any role) used by /participants/:id. */
export async function getUserProfileServer(
  id: string,
): Promise<UserProfile | null> {
  try {
    const res = await backendFetch(
      `/admin/users/${encodeURIComponent(id)}`,
      { method: "GET" },
    );
    if (res.status === 401 || res.status === 403) redirect("/signin");
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as { user: UserProfile };
    return data.user ?? null;
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    return null;
  }
}

export async function getFellowProfileServer(
  id: string,
): Promise<FellowProfile | null> {
  try {
    const res = await backendFetch(
      `/admin/fellows/${encodeURIComponent(id)}`,
      { method: "GET" },
    );
    if (res.status === 401 || res.status === 403) redirect("/signin");
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as { fellow: BackendFellowProfile };
    if (!data.fellow) return null;
    return mapFellowProfile(data.fellow);
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    return null;
  }
}

function mapCapstoneStatus(
  s: string | null | undefined,
): CapstoneSnapshot["status"] {
  if (s === "draft") return "draft";
  if (s === "under_review") return "under-review";
  if (s === "approved") return "approved";
  if (s === "submitted" || s === "needs_revision") return "submitted";
  return "not-started";
}

function mapFellowProfile(f: BackendFellowProfile): FellowProfile {
  return {
    id: f.id,
    fullName: f.fullName ?? "",
    email: f.email ?? "",
    country: f.country ?? "",
    organisation: f.organisation ?? "",
    jobTitle: f.jobTitle ?? "",
    sector: prettySector(f.sector),
    mentor: f.mentorName ?? null,
    progressPercent: f.progressPercent ?? 0,
    attendanceRate: f.attendanceRate ?? 0,
    status: f.status === "at_risk" ? "at-risk" : f.status ?? "active",
    isActive: f.isActive ?? true,
    joinedAt: f.joinedAt,
    bio: f.bio ?? null,
    linkedinUrl: f.linkedinUrl ?? null,
    assignedMentor: f.mentor ?? null,
    hasMentorOverride: Boolean(f.mentorOverrideId),
    modules: (f.modules ?? []).map(
      (m): ModuleProgressEntry => ({
        weekNumber: m.weekNumber,
        title: m.title,
        status: m.status,
      }),
    ),
    recentSessions: f.recentSessions ?? [],
    assessments: f.assessments ?? [],
    capstone: f.capstone
      ? {
          status: mapCapstoneStatus(f.capstone.status),
          title: f.capstone.title ?? null,
          submittedAt: f.capstone.submittedAt ?? null,
          lastFeedback: f.capstone.lastFeedback ?? null,
        }
      : {
          status: "not-started",
          title: null,
          submittedAt: null,
          lastFeedback: null,
        },
    activity: f.activity ?? [],
  };
}

function prettySector(s: string | null): Sector {
  // Single source of truth in `@/lib/sector`, shared with the client views
  // so a raw token can't leak into the UI here or there.
  return sectorLabel(s);
}
