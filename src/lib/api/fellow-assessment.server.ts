/**
 * Server-only fellow attempt readers. Uses `next/headers` (via `backendFetch`)
 * — never import from a client component.
 */
import "server-only";
import { backendFetch } from "./backend";
import type { FellowAttempt, ModuleAttemptSummary } from "./fellow-assessment";

/** Fetch the per-module attempt summary for the current fellow. */
export async function getModuleAttemptSummaryServer(
  moduleId: string,
): Promise<ModuleAttemptSummary | null> {
  try {
    const res = await backendFetch(
      `/modules/${encodeURIComponent(moduleId)}/my-attempts`,
      { method: "GET" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { summary: ModuleAttemptSummary };
    return data.summary;
  } catch {
    return null;
  }
}

/** Fetch a single attempt visible to the current user. */
export async function getMyAttempt(
  attemptId: string,
): Promise<FellowAttempt | null> {
  try {
    const res = await backendFetch(
      `/attempts/${encodeURIComponent(attemptId)}`,
      { method: "GET" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { attempt: FellowAttempt };
    return data.attempt;
  } catch {
    return null;
  }
}

/** Fetch all attempts the current user owns (fellow view). */
export async function getMyAttempts(): Promise<FellowAttempt[] | null> {
  try {
    const res = await backendFetch("/attempts/me", { method: "GET" });
    if (!res.ok) return null;
    const data = (await res.json()) as { attempts: FellowAttempt[] };
    return data.attempts;
  } catch {
    return null;
  }
}
