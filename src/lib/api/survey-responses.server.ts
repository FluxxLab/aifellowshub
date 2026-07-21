import "server-only";
import { backendFetch } from "./backend";

export type SurveyResponseRow = {
  id: string;
  submittedAt: string;
  updatedAt: string;
  answers: Record<string, unknown>;
  fellow: {
    id: string;
    fullName: string;
    email: string;
    sector: string | null;
    country: string | null;
  };
};

/** Week 1 baseline (pre-fellowship) survey responses. */
export async function listSurveyResponsesServer(): Promise<SurveyResponseRow[]> {
  try {
    const res = await backendFetch("/admin/survey-responses", { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as { responses: SurveyResponseRow[] };
    return data.responses ?? [];
  } catch {
    return [];
  }
}

/**
 * Week 9 endline (end-of-programme) survey responses. Same question set as the
 * Week 1 baseline but a separate response set, so the two can be compared.
 */
export async function listEndOfProgrammeSurveyResponsesServer(): Promise<
  SurveyResponseRow[]
> {
  try {
    const res = await backendFetch(
      "/admin/end-of-programme-survey-responses",
      { method: "GET" },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { responses: SurveyResponseRow[] };
    return data.responses ?? [];
  } catch {
    return [];
  }
}
