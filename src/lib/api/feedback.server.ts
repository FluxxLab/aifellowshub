/**
 * Server-side helpers for end-of-module feedback (BRD §6.10 extension).
 * These run on the Next.js server, forwarding the fellow's auth cookie
 * to the NestJS backend.
 */
import { backendFetch } from "./backend";
import type { ModuleFeedback } from "./fellow-learning";

type FeedbackResponse = { feedback: ModuleFeedback | null };

/**
 * Fetch the current fellow's feedback row for a module. Returns null
 * when none exists yet OR when the backend is unreachable.
 */
export async function getMyModuleFeedbackServer(
  moduleId: string,
): Promise<ModuleFeedback | null> {
  try {
    const res = await backendFetch(
      `/modules/${encodeURIComponent(moduleId)}/feedback/me`,
      { method: "GET" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as FeedbackResponse;
    return data.feedback;
  } catch {
    return null;
  }
}

export type FeedbackAggregate = {
  moduleId: string;
  count: number;
  averages: {
    overall: number | null;
    content: number | null;
    sessions: number | null;
    mentor: number | null;
  };
  submissions: {
    id: string;
    overallRating: number;
    contentRating: number;
    sessionRating: number;
    mentorRating: number;
    whatWorked: string | null;
    whatDidnt: string | null;
    submittedAt: string;
  }[];
};

/**
 * Admin/faculty/super_admin aggregate view. fellowIds are stripped
 * server-side — comments are anonymous.
 */
export async function getModuleFeedbackAggregateServer(
  moduleId: string,
): Promise<FeedbackAggregate | null> {
  try {
    const res = await backendFetch(
      `/modules/${encodeURIComponent(moduleId)}/feedback`,
      { method: "GET" },
    );
    if (!res.ok) return null;
    return (await res.json()) as FeedbackAggregate;
  } catch {
    return null;
  }
}
