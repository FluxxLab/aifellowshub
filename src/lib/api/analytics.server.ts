/**
 * Server-only analytics fetcher (BRD §6.12). Pulls from
 * `GET /analytics/overview` (admin only) and folds into the existing
 * `AnalyticsSummary` shape. Returns an empty summary when the backend
 * is unreachable so admin pages render their zero-state.
 */
import "server-only";
import { backendFetch } from "./backend";
import type {
  AnalyticsSummary,
  CapstoneFunnelPoint,
  ModulePerformance,
} from "./analytics";

type BackendOverview = {
  modulesPerformance: {
    weekNumber: number;
    moduleId: string;
    title: string;
    attempts: number;
    attendanceRate: number | null;
    completionPercent: number | null;
    passRate: number | null;
    averageScore: number | null;
  }[];
  scoreDistribution: { bucket: string; count: number }[];
  capstoneFunnel: { stage: string; count: number }[];
  attemptsTotal: number;
  attemptsPassed: number;
  certificatesIssued: number;
  fellowsTotal: number;
  forumActivity: { threads: number; replies: number };
  aiUsage: { messagesLast24h: number; messagesTotal: number };
};

const EMPTY: AnalyticsSummary = {
  cohortName: "Cohort 2026",
  currentWeek: 0,
  totalWeeks: 12,
  enrolledCount: 0,
  modulePerformance: [],
  assessmentDistributions: [],
  capstoneFunnel: [],
  totals: {
    totalAssessmentAttempts: 0,
    totalAssessmentPasses: 0,
    totalCapstonesSubmitted: 0,
    totalCertificatesIssued: 0,
  },
};

export async function getAnalyticsSummaryServer(): Promise<AnalyticsSummary> {
  try {
    const res = await backendFetch("/analytics/overview", { method: "GET" });
    if (!res.ok) return EMPTY;
    const data = (await res.json()) as BackendOverview;
    return mapOverview(data);
  } catch {
    return EMPTY;
  }
}

function mapOverview(data: BackendOverview): AnalyticsSummary {
  const modulePerformance: ModulePerformance[] = data.modulesPerformance.map(
    (m) => ({
      weekNumber: m.weekNumber,
      moduleTitle: m.title,
      attendancePercent: m.attendanceRate ?? 0,
      assessmentPassPercent: m.passRate,
      assessmentAvgScore: m.averageScore,
      completionPercent: m.completionPercent ?? 0,
    }),
  );

  // Map backend stage names → frontend status names.
  const stageMap: Record<string, CapstoneFunnelPoint["status"]> = {
    scoping: "draft",
    design: "submitted",
    consultation: "under-review",
    final: "revision-required",
    approved: "approved",
  };
  const capstoneFunnel: CapstoneFunnelPoint[] = data.capstoneFunnel.map((p) => ({
    status: stageMap[p.stage] ?? "draft",
    label: capitalise(p.stage.replace("_", " ")),
    count: p.count,
  }));

  return {
    cohortName: "Cohort 2026",
    currentWeek: 0,
    totalWeeks: 12,
    enrolledCount: data.fellowsTotal,
    modulePerformance,
    assessmentDistributions: [],
    capstoneFunnel,
    totals: {
      totalAssessmentAttempts: data.attemptsTotal,
      totalAssessmentPasses: data.attemptsPassed,
      totalCapstonesSubmitted:
        data.capstoneFunnel.find((p) => p.stage === "approved")?.count ?? 0,
      totalCertificatesIssued: data.certificatesIssued,
    },
  };
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
