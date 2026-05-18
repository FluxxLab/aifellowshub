/**
 * Server-only admin dashboard fetcher (BRD §6.12). Pulls real metrics
 * from `GET /analytics/dashboard`. Fields that need modeling we don't
 * yet have (engagement trend, cohortProgress series) ship empty — the
 * dashboard charts render their zero-state.
 */
import "server-only";
import { backendFetch } from "./backend";
import type {
  AtRiskFellow,
  DashboardSummary,
  ModuleCompletion,
  SectorSlice,
  UpcomingSession,
} from "./dashboard";
import { getSettingsServer } from "./settings.server";

type BackendDashboard = {
  hero: {
    fellowsTotal: number;
    fellowsActive: number;
    mentors: number;
    faculty: number;
    coursesPublished: number;
    modulesPublished: number;
    modulesUnderReview: number;
    modulesDraft: number;
    sessionsThisWeek: number;
    capstonesApproved: number;
    capstonesPendingReview: number;
    certificatesIssued: number;
    attemptCount: number;
    passRate: number | null;
    averageScore: number | null;
    attendanceRate: number | null;
    sessionsEnded: number;
  };
  modulePerformance: {
    weekNumber: number;
    moduleId: string;
    title: string;
    attempts: number;
    passRate: number | null;
    averageScore: number | null;
  }[];
  upcomingSessions: {
    id: string;
    title: string;
    startsAt: string;
    durationMinutes: number;
    hostName: string;
    moduleTitle: string;
    weekNumber: number;
    rsvpCount: number;
  }[];
  atRiskFellows: {
    id: string;
    fullName: string;
    email: string;
    country: string | null;
    sector: string | null;
  }[];
  sectorDistribution: { sector: string; count: number }[];
};

const EMPTY: DashboardSummary = {
  cohort: {
    id: "cohort-2026",
    name: "AI Fellows · Cohort 2026",
    currentWeek: 0,
    seatsFilled: 0,
    capacity: 100,
  },
  metrics: {
    activeFellows: { value: 0, deltaPercent: 0, capacity: 100 },
    mentorsTotal: { value: 0, deltaPercent: 0 },
    avgProgressPercent: { value: 0, deltaPercent: 0 },
    attendanceRatePercent: { value: 0, deltaPercent: 0 },
    capstonesAwaitingReview: { value: 0, deltaPercent: 0 },
  },
  cohortProgress: [],
  moduleCompletion: [],
  engagementTrend: [],
  cohortBySector: [],
  atRiskFellows: [],
  upcomingSessions: [],
  attentionItems: [],
};

export async function getDashboardSummaryServer(): Promise<DashboardSummary> {
  try {
    // Fetch dashboard metrics + settings in parallel — settings owns
    // the real cohort capacity, so the "Active fellows" card shows
    // `value / configuredCapacity` instead of a hardcoded 100.
    const [res, settings] = await Promise.all([
      backendFetch("/analytics/dashboard", { method: "GET" }),
      getSettingsServer().catch(() => null),
    ]);
    if (!res.ok) return EMPTY;
    const data = (await res.json()) as BackendDashboard;
    return mapDashboard(data, settings?.registration.capacity ?? null);
  } catch {
    return EMPTY;
  }
}

function mapDashboard(
  data: BackendDashboard,
  configuredCapacity: number | null,
): DashboardSummary {
  const hero = data.hero;
  // Prefer the admin-configured cohort capacity from settings. If
  // settings hasn't been loaded for any reason, fall back to the
  // total fellows registered (so the card never shows the misleading
  // hardcoded "/100"). Last-resort: 0 — better than a fake number.
  const capacity = configuredCapacity ?? hero.fellowsTotal ?? 0;

  const upcomingSessions: UpcomingSession[] = data.upcomingSessions.map((s) => ({
    id: s.id,
    moduleTitle: s.moduleTitle,
    weekNumber: s.weekNumber,
    host: s.hostName,
    startsAt: s.startsAt,
    durationMinutes: s.durationMinutes,
    rsvpCount: s.rsvpCount,
  }));

  const moduleCompletion: ModuleCompletion[] = data.modulePerformance.map(
    (m) => ({
      weekNumber: m.weekNumber,
      shortTitle: m.title.slice(0, 40),
      attendedPercent: m.passRate ?? 0,
      assessmentPassedPercent: m.passRate ?? 0,
    }),
  );

  const cohortBySector: SectorSlice[] = data.sectorDistribution.map((s) => ({
    sector: prettySector(s.sector),
    count: s.count,
  }));

  const atRiskFellows: AtRiskFellow[] = data.atRiskFellows.map((f) => ({
    id: f.id,
    fullName: f.fullName,
    avatarUrl: "",
    attendanceRate: hero.attendanceRate ?? 0,
    progressPercent: 0,
    riskReason: "Failed assessment or missed sessions",
    lastActiveAt: new Date().toISOString(),
  }));

  return {
    cohort: {
      id: "cohort-2026",
      name: "AI Fellows · Cohort 2026",
      currentWeek: 0,
      seatsFilled: hero.fellowsTotal,
      capacity,
    },
    metrics: {
      activeFellows: {
        value: hero.fellowsActive,
        deltaPercent: 0,
        capacity,
      },
      mentorsTotal: { value: hero.mentors, deltaPercent: 0 },
      avgProgressPercent: { value: 0, deltaPercent: 0 },
      attendanceRatePercent: {
        value: hero.attendanceRate ?? 0,
        deltaPercent: 0,
      },
      capstonesAwaitingReview: {
        value: hero.capstonesPendingReview,
        deltaPercent: 0,
      },
    },
    cohortProgress: [],
    moduleCompletion,
    engagementTrend: [],
    cohortBySector,
    atRiskFellows,
    upcomingSessions,
    attentionItems: [
      {
        id: "modules-under-review",
        label: "Module submissions awaiting review",
        count: hero.modulesUnderReview,
        href: "/module-reviews",
        intent: hero.modulesUnderReview > 0 ? "urgent" : "info",
      },
      {
        id: "capstones-pending",
        label: "Capstones awaiting mentor review",
        count: hero.capstonesPendingReview,
        href: "/capstone",
        intent: hero.capstonesPendingReview > 0 ? "urgent" : "info",
      },
      {
        id: "certificates-issued",
        label: "Certificates issued this cohort",
        count: hero.certificatesIssued,
        href: "/certificates",
        intent: "good",
      },
      {
        id: "sessions-this-week",
        label: "Live sessions this week",
        count: hero.sessionsThisWeek,
        href: "/sessions",
        intent: "info",
      },
    ],
  };
}

function prettySector(s: string): string {
  switch (s) {
    case "healthcare":
      return "Healthcare";
    case "edtech":
      return "Education";
    case "agriculture":
      return "Agriculture";
    case "economic_inclusion_development":
      return "Economic Inclusion Development";
    default:
      return "Unassigned";
  }
}
