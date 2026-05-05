/**
 * Fellow assessment-taking — real backend client (BRD §6.5).
 *
 * Used by the `/assessments/[moduleId]/take` route. Talks to GET
 * /modules/:id/take, which serialises via `toFellowAssessment` on the
 * backend so `isCorrect` is stripped out before the response leaves the
 * server. Never use the faculty `/modules/:id` shape here — it leaks the
 * answer key.
 */
import { apiFetch } from "./client";
import {
  ANSWER_UPLOAD_ALLOWED_MIME,
  ANSWER_UPLOAD_MAX_BYTES,
  isAllowedAnswerMime,
  uploadFileToSignedUrl,
  type AnswerUploadMime,
  type SignedUploadResponse,
} from "./uploads";

// Re-export so AssessmentTaker can import limits from one path.
export {
  ANSWER_UPLOAD_ALLOWED_MIME,
  ANSWER_UPLOAD_MAX_BYTES,
  isAllowedAnswerMime,
};
export type { AnswerUploadMime };

export type FellowQuestionKind =
  | "multiple_choice"
  | "short_text"
  | "essay"
  | "attachment";

export type FellowChoice = {
  id: string;
  text: string;
};

export type FellowQuestion = {
  id: string;
  assessmentId: string;
  prompt: string;
  kind: FellowQuestionKind;
  /** Empty for non-multiple-choice kinds. */
  choices: FellowChoice[];
  /** Word/character cap for short_text / essay. Null = no cap. */
  maxLength: number | null;
  orderIndex: number;
};

export type FellowAssessment = {
  id: string;
  moduleId: string;
  title: string;
  passingScore: number;
  timeLimitMinutes: number;
  questions: FellowQuestion[];
};

/**
 * Fetch the assessment for a fellow about to take it. The backend strips
 * `isCorrect` from choices and rejects modules that aren't published.
 */
export async function getAssessmentToTake(
  moduleId: string,
): Promise<FellowAssessment> {
  const data = await apiFetch<{ assessment: FellowAssessment }>(
    `/modules/${encodeURIComponent(moduleId)}/take`,
  );
  return data.assessment;
}

/* ---------- submission shape (Phase 2 will persist) ---------- */

export type FellowAnswer =
  | { questionId: string; kind: "multiple_choice"; choiceId: string | null }
  | { questionId: string; kind: "short_text"; text: string }
  | { questionId: string; kind: "essay"; text: string }
  /**
   * Attachment answers carry the upload result directly. The fellow
   * uploads the file BEFORE submitting (browser → Spaces, see
   * `uploadFileToSignedUrl`), then includes the resulting URL +
   * metadata here. Submitting an attachment answer with a null
   * `fileUrl` is allowed (treated as "skipped — grade as 0") so the
   * fellow can still finalise an attempt if upload failed.
   */
  | {
      questionId: string;
      kind: "attachment";
      fileName: string | null;
      fileUrl: string | null;
      fileMimeType: string | null;
      fileBytes: number | null;
    };

export type SubmitAssessmentPayload = {
  moduleId: string;
  answers: FellowAnswer[];
};

export type AttemptStatus = "passed" | "failed" | "pending_review";

export type FellowAttemptAnswer = {
  id: string;
  questionId: string;
  question: {
    id: string;
    prompt: string;
    kind: FellowQuestionKind;
    choices: FellowChoice[];
    maxLength: number | null;
  };
  choiceId: string | null;
  text: string | null;
  fileName: string | null;
  fileUrl: string | null;
  fileMimeType: string | null;
  fileBytes: number | null;
  score: number | null;
  feedback: string | null;
  gradedAt: string | null;
};

export type FellowAttempt = {
  id: string;
  status: AttemptStatus;
  /** Final percentage 0–100. Null while pending_review. */
  score: number | null;
  submittedAt: string;
  gradedAt: string | null;
  assessment: {
    id: string;
    title: string;
    passingScore: number;
    module: {
      id: string;
      title: string;
      weekNumber: number;
    } | null;
  } | null;
  answers: FellowAttemptAnswer[];
};

/** Submit a fellow's attempt. Auto-grades MC; manual kinds queue for review. */
export async function submitAttempt(
  moduleId: string,
  answers: FellowAnswer[],
): Promise<FellowAttempt> {
  const data = await apiFetch<{ attempt: FellowAttempt }>(
    `/modules/${encodeURIComponent(moduleId)}/submit`,
    { method: "POST", body: { answers } },
  );
  return data.attempt;
}

/** Fellow lists their own attempts (most recent first). */
export async function listMyAttempts(): Promise<FellowAttempt[]> {
  const data = await apiFetch<{ attempts: FellowAttempt[] }>("/attempts/me");
  return data.attempts;
}

/** Why a fellow can't start a new attempt — null = clear to go. */
export type AttemptBlockReason =
  | "passed"
  | "pending_review"
  | "no_attempts_left"
  | "no_assessment"
  | null;

/** Per-module attempt state shown on the take page and learning surface. */
export type ModuleAttemptSummary = {
  attemptsUsed: number;
  attemptsAllowed: number;
  canStart: boolean;
  blockReason: AttemptBlockReason;
  bestAttemptId: string | null;
  bestScore: number | null;
  bestStatus: AttemptStatus | null;
  latestAttemptId: string | null;
  latestStatus: AttemptStatus | null;
};

export async function getModuleAttemptSummary(
  moduleId: string,
): Promise<ModuleAttemptSummary> {
  const data = await apiFetch<{ summary: ModuleAttemptSummary }>(
    `/modules/${encodeURIComponent(moduleId)}/my-attempts`,
  );
  return data.summary;
}

/* ---------- Attachment upload (fellow scratch flow) ---------- */

/**
 * Result of a successful upload — the bits the AssessmentTaker stores
 * in its in-memory answer state and forwards to the backend on
 * submit. The backend's submit endpoint accepts these alongside the
 * usual answer body and persists them on the new answer row.
 */
export type UploadedAnswerFile = {
  fileUrl: string;
  fileMimeType: string;
  fileBytes: number;
  fileName: string;
};

/**
 * Step 1 of the upload flow — ask the backend for a presigned PUT URL
 * targeting the fellow's scratch namespace. Backend signs server-side
 * with the Spaces secret; the browser never sees it.
 */
export async function getAnswerUploadUrl(payload: {
  mimeType: AnswerUploadMime;
  bytes: number;
  filename: string;
}): Promise<SignedUploadResponse> {
  return apiFetch<SignedUploadResponse>("/me/attempts/upload-url", {
    method: "POST",
    body: payload,
  });
}

/**
 * Convenience: validate the file, mint a signed URL, upload the
 * bytes, return the metadata the form needs. The single function
 * `AnswerFileUpload` calls.
 */
export async function uploadAnswerFile(
  file: File,
  options: { onProgress?: (loaded: number, total: number) => void } = {},
): Promise<UploadedAnswerFile> {
  if (!isAllowedAnswerMime(file.type)) {
    throw new Error(
      `Unsupported file type: ${file.type || "unknown"}. Allowed: PDF, Word/PowerPoint, image, or plain text.`,
    );
  }
  if (file.size > ANSWER_UPLOAD_MAX_BYTES) {
    throw new Error(
      `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is ${ANSWER_UPLOAD_MAX_BYTES / 1024 / 1024} MB.`,
    );
  }
  const signed = await getAnswerUploadUrl({
    mimeType: file.type,
    bytes: file.size,
    filename: file.name,
  });
  await uploadFileToSignedUrl(signed.uploadUrl, file, options);
  return {
    fileUrl: signed.publicUrl,
    fileMimeType: file.type,
    fileBytes: file.size,
    fileName: file.name,
  };
}
