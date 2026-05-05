/**
 * Grading — types + client-safe helpers for faculty/admin (BRD §6.5).
 *
 * Server-side readers live in `grading.server.ts`. The grader-facing shape
 * includes `isCorrect` on choices so faculty can verify auto-grading; never
 * expose this through fellow-facing routes.
 */
import { apiFetch } from "./client";

export type GraderQuestionKind =
  | "multiple_choice"
  | "short_text"
  | "essay"
  | "attachment";

export type GraderChoice = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type GraderAttemptAnswer = {
  id: string;
  questionId: string;
  question: {
    id: string;
    prompt: string;
    kind: GraderQuestionKind;
    choices: GraderChoice[];
    maxLength: number | null;
  };
  choiceId: string | null;
  text: string | null;
  /** Original filename the fellow uploaded — used as display label. */
  fileName: string | null;
  /** Public URL of the uploaded answer file (DigitalOcean Spaces).
   *  Null when fellow hasn't attached anything yet, or for non-attachment
   *  question kinds. */
  fileUrl: string | null;
  fileMimeType: string | null;
  fileBytes: number | null;
  /** 0–1 fractional credit; null while ungraded (manual kinds before review). */
  score: number | null;
  feedback: string | null;
  gradedById: string | null;
  gradedAt: string | null;
};

export type GraderAttempt = {
  id: string;
  status: "passed" | "failed" | "pending_review";
  /** Final 0–100 percentage. Null while pending_review. */
  score: number | null;
  submittedAt: string;
  gradedAt: string | null;
  fellow: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  assessment: {
    id: string;
    title: string;
    passingScore: number;
    module: {
      id: string;
      title: string;
      weekNumber: number;
      course: { id: string; title: string } | null;
    } | null;
  } | null;
  answers: GraderAttemptAnswer[];
};

export type GradeOnePayload = {
  answerId: string;
  /** 0–1 fractional credit. */
  score: number;
  feedback?: string;
};

/** Submit grades for one or more manual answers in an attempt. */
export async function gradeAttempt(
  attemptId: string,
  grades: GradeOnePayload[],
): Promise<GraderAttempt> {
  const data = await apiFetch<{ attempt: GraderAttempt }>(
    `/attempts/${encodeURIComponent(attemptId)}/grade`,
    { method: "POST", body: { grades } },
  );
  return data.attempt;
}
