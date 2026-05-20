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
