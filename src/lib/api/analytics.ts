/**
 * Analytics — admin deep-dive (BRD §6.12). Public types only; reads run
 * through `analytics.server.ts` (`GET /analytics/overview`).
 */

export type ModulePerformance = {
  weekNumber: number;
  moduleTitle: string;
  attendancePercent: number;
  /** Pass rate for the linked assessment, or null if no assessment / not yet attempted. */
  assessmentPassPercent: number | null;
  /** Average raw score (0–100) for the linked assessment, or null. */
  assessmentAvgScore: number | null;
  /** % of fellows who completed the module via either path. */
  completionPercent: number;
};

export type AssessmentDistribution = {
  assessmentId: string;
  assessmentTitle: string;
  weekNumber: number | null;
  /** Histogram buckets: how many fellows scored in each band. */
  buckets: { label: string; min: number; max: number; count: number }[];
  attemptsCount: number;
  passMark: number;
  passedCount: number;
  avgScore: number;
};

export type CapstoneFunnelPoint = {
  status: "draft"| "submitted"| "under-review"| "revision-required"| "approved";
  label: string;
  count: number;
};

export type AnalyticsSummary = {
  cohortName: string;
  currentWeek: number;
  totalWeeks: number;
  enrolledCount: number;
  modulePerformance: ModulePerformance[];
  assessmentDistributions: AssessmentDistribution[];
  capstoneFunnel: CapstoneFunnelPoint[];
  /** Headline numbers different from the dashboard's "today" view — these are cumulative. */
  totals: {
    totalAssessmentAttempts: number;
    totalAssessmentPasses: number;
    totalCapstonesSubmitted: number;
    totalCertificatesIssued: number;
  };
};

