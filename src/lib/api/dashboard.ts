/**
 * Dashboard data — public types only.
 *
 * Reads run through `dashboard.server.ts` (which calls
 * `GET /analytics/dashboard`). Page code never imports `getDashboardSummary`
 * directly — only the server fetcher.
 */

export type Trend = {
  value: number;
  /**
   * Percentage change vs. the previous period. Positive = up, negative = down.
   * UI decides whether "up" means good (e.g. progress) or bad (e.g. drop-off).
   */
  deltaPercent: number;
};

export type DashboardSummary = {
  cohort: {
    id: string;
    name: string;
    currentWeek: number;
    seatsFilled: number;
    capacity: number;
  };
  metrics: {
    activeFellows: Trend & { capacity: number };
    /** Total number of users with role=mentor (across the cohort). */
    mentorsTotal: Trend;
    avgProgressPercent: Trend;
    attendanceRatePercent: Trend;
    capstonesAwaitingReview: Trend;
  };
  cohortProgress: {
    weekNumber: number;
    avgCompletionPercent: number;
  }[];
  moduleCompletion: ModuleCompletion[];
  engagementTrend: EngagementPoint[];
  cohortBySector: SectorSlice[];
  atRiskFellows: AtRiskFellow[];
  upcomingSessions: UpcomingSession[];
  attentionItems: AttentionItem[];
};

export type ModuleCompletion = {
  weekNumber: number;
  shortTitle: string;
  attendedPercent: number;
  assessmentPassedPercent: number;
};

export type EngagementPoint = {
  /** ISO date (yyyy-mm-dd) */
  date: string;
  forumMessages: number;
  aiBuddyMessages: number;
};

export type SectorSlice = {
  sector: string;
  count: number;
};

export type AtRiskFellow = {
  id: string;
  fullName: string;
  avatarUrl: string;
  attendanceRate: number;
  progressPercent: number;
  riskReason: string;
  /** ISO date — last activity (session join, module access, forum post) */
  lastActiveAt: string;
};

export type AttentionItem = {
  id: string;
  label: string;
  count: number;
  href: string;
  /**
   * Severity hint for UI emphasis.
   * "urgent"→ red dot; "info"→ neutral; "good" → green (e.g. milestones)
   */
  intent: "urgent"| "info"| "good";
};

export type UpcomingSession = {
  id: string;
  moduleTitle: string;
  weekNumber: number;
  host: string;
  startsAt: string; // ISO timestamp
  durationMinutes: number;
  rsvpCount: number;
};

