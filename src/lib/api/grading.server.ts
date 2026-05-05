/**
 * Server-only grading reads. Uses `next/headers` (via `backendFetch`) — never
 * import from a client component.
 */
import "server-only";
import { backendFetch } from "./backend";
import type { GraderAttempt } from "./grading";

/**
 * Fetch the grading queue (pending_review attempts the current user is allowed
 * to grade). Returns `null` if the backend is unreachable so pages can render
 * an empty/error state instead of crashing.
 */
export async function getGradingQueue(): Promise<GraderAttempt[] | null> {
  try {
    const res = await backendFetch("/attempts/grading-queue", { method: "GET" });
    if (!res.ok) return null;
    const data = (await res.json()) as { attempts: GraderAttempt[] };
    return data.attempts;
  } catch {
    return null;
  }
}

export async function getAttemptForGrader(
  attemptId: string,
): Promise<GraderAttempt | null> {
  try {
    const res = await backendFetch(
      `/attempts/${encodeURIComponent(attemptId)}`,
      { method: "GET" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { attempt: GraderAttempt };
    return data.attempt;
  } catch {
    return null;
  }
}
