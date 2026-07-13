/**
 * Server-only cohort banner fetcher. Backs the "… is in week N of M" line on
 * BOTH the admin dashboard and the fellow home, so the two always agree. Name
 * comes from programme settings (`cohortName`); the week is the cohort's
 * calendar week; the length is `cohortWeekCount`.
 */
import "server-only";
import { backendFetch } from "./backend";

export type CohortStatus = {
  name: string;
  currentWeek: number;
  weekCount: number;
};

const FALLBACK: CohortStatus = {
  name: "AI Fellows Cohort",
  currentWeek: 0,
  weekCount: 10,
};

export async function getCohortStatusServer(): Promise<CohortStatus> {
  try {
    const res = await backendFetch("/analytics/me/cohort", { method: "GET" });
    if (!res.ok) return FALLBACK;
    return (await res.json()) as CohortStatus;
  } catch {
    return FALLBACK;
  }
}
