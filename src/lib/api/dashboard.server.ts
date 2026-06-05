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
    deltas?: {
      activeFellowsDelta: number;
      attendanceRateDelta: number;
      capstonesDelta: number;
    };
  };
  modulePerformance: {
    weekNumber: number;
    moduleId: string;
    title: string;
    attempts: number;
    attendanceRate: number | null;
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
  cohortProgress: { weekNumber: number; avgCompletionPercent: number }[];
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

/**
 * Derive the cohort's current week from the data already in the
 * dashboard response — no extra round-trip needed.
 *
 * Priority:
 *  1. First upcoming session's weekNumber (the week the cohort is moving
 *     toward, or currently in if a live session is running).
 *  2. Max weekNumber across module performance rows (highest week with
 *     any real activity — safe fallback when all sessions have ended).
 *  3. Max weekNumber across cohort-progress rows.
 *  4. 0 — genuinely nothing has started yet.
 */
function deriveCurrentWeek(data: BackendDashboard): number {
  if (data.upcomingSessions.length > 0) {
    return data.upcomingSessions[0].weekNumber;
  }
  // cohortProgress only has rows for weeks where fellows made real progress —
  // reliable indicator of "how far the cohort has gotten".
  if ((data.cohortProgress ?? []).length > 0) {
    return Math.max(...data.cohortProgress.map((w) => w.weekNumber));
  }
  // modulePerformance includes all published modules (even future ones with
  // zero activity). Only count rows with real attempts so we don't jump
  // ahead to the last published week.
  const activeModules = data.modulePerformance.filter((m) => m.attempts > 0);
  if (activeModules.length > 0) {
    return Math.max(...activeModules.map((m) => m.weekNumber));
  }
  return 0;
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
      attendedPercent: m.attendanceRate ?? 0,
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

  const d = hero.deltas;
  const progressValues = (data.cohortProgress ?? []).map(
    (w) => w.avgCompletionPercent,
  );
  const avgProgress =
    progressValues.length === 0
      ? 0
      : Math.round(
          progressValues.reduce((a, b) => a + b, 0) / progressValues.length,
        );
  const progressDelta =
    progressValues.length >= 2
      ? +(
          progressValues[progressValues.length - 1] -
          progressValues[progressValues.length - 2]
        ).toFixed(1)
      : 0;

  return {
    cohort: {
      id: "cohort-2026",
      name: "AI Fellows · Cohort 2026",
      currentWeek: deriveCurrentWeek(data),
      seatsFilled: hero.fellowsTotal,
      capacity,
    },
    metrics: {
      activeFellows: {
        value: hero.fellowsActive,
        deltaPercent: d?.activeFellowsDelta ?? 0,
        capacity,
      },
      mentorsTotal: { value: hero.mentors, deltaPercent: 0 },
      avgProgressPercent: { value: avgProgress, deltaPercent: progressDelta },
      attendanceRatePercent: {
        value: hero.attendanceRate ?? 0,
        deltaPercent: d?.attendanceRateDelta ?? 0,
      },
      capstonesAwaitingReview: {
        value: hero.capstonesPendingReview,
        deltaPercent: d?.capstonesDelta ?? 0,
      },
    },
    cohortProgress: (data.cohortProgress ?? []).map((w) => ({
      weekNumber: w.weekNumber,
      avgCompletionPercent: w.avgCompletionPercent,
    })),
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
