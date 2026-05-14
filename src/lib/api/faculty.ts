/**
 * Faculty — types + client-safe helpers (BRD §6.3, §6.5).
 *
 * Server-side readers (which use `next/headers` for cookie forwarding) live
 * in `faculty.server.ts`. Client components must NOT import that file.
 *
 * Faculty are content owners — they author and curate modules, lessons,
 * assessments, and resources. Distinct from admin (programme operations) and
 * mentor (capstone supervision).
 */
import { apiFetch } from "./client";
import {
  uploadFileToSignedUrl,
  uploadFileViaMultipartPost,
  type SignedUploadResponse,
} from "./uploads";

export type FacultyModuleStatus = "published" | "draft" | "under-review";

export type FacultyLessonKind = "reading" | "video" | "exercise";

export type FacultyLesson = {
  id: string;
  title: string;
  summary: string;
  kind: FacultyLessonKind;
  durationMinutes: number;
  /**
   * Public URL of the uploaded content (DigitalOcean Spaces / CDN).
   * Null when the lesson has no attached content yet.
   */
  contentUrl: string | null;
  contentMimeType: string | null;
  contentBytes: number | null;
};

export type FacultyResource = {
  id: string;
  title: string;
  kind: "pdf" | "link" | "video";
  url: string;
  description: string;
  tags: string[];
  featured: boolean;
  durationMinutes: number;
};

export type FacultySession = {
  id: string;
  title: string;
  /** ISO timestamp of when the session starts. */
  startsAt: string;
  durationMinutes: number;
  /** Auto-credit threshold; null = use 50% of duration. */
  attendanceThresholdMinutes: number | null;
  joinUrl: string | null;
  zoomMeetingId: string | null;
  status: "scheduled" | "live" | "ended" | "cancelled";
  host: { id: string; fullName: string } | null;
};

export type AssessmentChoice = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type AssessmentQuestionKind =
  | "multiple_choice"
  | "short_text"
  | "essay"
  | "attachment";

export type AssessmentQuestion = {
  id: string;
  prompt: string;
  kind: AssessmentQuestionKind;
  /** Populated only when kind = "multiple_choice"; empty otherwise. */
  choices: AssessmentChoice[];
  /** Word/character cap for short_text / essay answers. Null = no cap. */
  maxLength: number | null;
};

export type FacultyAssessmentMeta = {
  id: string;
  title: string;
  questionCount: number;
  passingScore: number;
  /** Average score across attempts so far. Null if no attempts yet. */
  averageScore: number | null;
  /** Whether the backend has materialised the assessment row. */
  exists: boolean;
  questions: AssessmentQuestion[];
};

export type FacultyModuleSummary = {
  id: string;
  /** Owning course id — drives the role-aware breadcrumbs in the editor. */
  courseId: string;
  weekNumber: number;
  title: string;
  summary: string;
  status: FacultyModuleStatus;
  lessonsCount: number;
  /** Active fellows currently in this module across all cohorts. */
  enrolledFellows: number;
  /** Average assessment score (0-100) — null if no attempts. */
  averageAssessmentScore: number | null;
  lastEditedAt: string;
};

export type FacultyModuleDetail = FacultyModuleSummary & {
  lessons: FacultyLesson[];
  resources: FacultyResource[];
  assessment: FacultyAssessmentMeta;
  session: FacultySession | null;
  /**
   * If status is "draft", this is the published version's last-edited date —
   * shown in the edit UI as "you have unsaved changes since X".
   */
  publishedAt: string | null;
};

export type FacultyActivityEntry = {
  id: string;
  message: string;
  at: string;
};

export type FacultyHome = {
  modulesOwned: number;
  modulesPublished: number;
  modulesInDraft: number;
  modulesUnderReview: number;
  activeFellows: number;
  averageScore: number | null;
  recentActivity: FacultyActivityEntry[];
};

/* ---------- Admin-side: faculty submission review queue (BRD §6.3, §6.5) ---------- */

export type FacultyReviewKind = "new" | "revision";

export type FacultyReviewSubmitter = {
  id: string;
  name: string;
};

export type FacultyReviewItem = {
  /** Unique submission id (different from the module id). */
  id: string;
  moduleId: string;
  moduleTitle: string;
  moduleSummary: string;
  weekNumber: number;
  kind: FacultyReviewKind;
  submittedBy: FacultyReviewSubmitter;
  submittedAt: string;
  /** Full module detail for the review page. */
  detail: FacultyModuleDetail;
};

/* ---------- Backend response shapes + mappers ---------- */

export type BackendLesson = {
  id: string;
  moduleId: string;
  title: string;
  summary: string;
  kind: FacultyLessonKind;
  durationMinutes: number;
  orderIndex: number;
  contentUrl: string | null;
  contentMimeType: string | null;
  contentBytes: number | null;
};

export type BackendResource = {
  id: string;
  moduleId: string;
  title: string;
  url: string;
  kind: "pdf" | "link" | "video";
  description: string;
  tags: string[];
  featured: boolean;
  durationMinutes: number;
  orderIndex: number;
};

export type BackendQuestion = {
  id: string;
  assessmentId: string;
  prompt: string;
  kind: AssessmentQuestionKind;
  choices: AssessmentChoice[];
  maxLength: number | null;
  orderIndex: number;
};

export type BackendAssessment = {
  id: string;
  moduleId: string;
  title: string;
  passingScore: number;
  timeLimitMinutes: number;
  questions: BackendQuestion[];
  questionCount: number;
};

export type BackendSession = {
  id: string;
  moduleId: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  attendanceThresholdMinutes: number | null;
  joinUrl: string | null;
  zoomMeetingId: string | null;
  status: "scheduled" | "live" | "ended" | "cancelled";
  host: { id: string; fullName: string } | null;
};

export type BackendModule = {
  id: string;
  courseId: string;
  weekNumber: number;
  title: string;
  summary: string;
  status: "draft" | "under_review" | "published";
  unlockCondition: string;
  orderIndex: number;
  publishedAt: string | null;
  submittedAt: string | null;
  lessons: BackendLesson[];
  lessonCount: number;
  durationMinutes: number;
  resources?: BackendResource[];
  assessment?: BackendAssessment | null;
  session?: BackendSession | null;
  createdAt: string;
  updatedAt: string;
};

export function backendStatusToFaculty(
  s: BackendModule["status"],
): FacultyModuleStatus {
  return s === "under_review" ? "under-review" : s;
}

export function backendToModuleSummary(m: BackendModule): FacultyModuleSummary {
  return {
    id: m.id,
    courseId: m.courseId,
    weekNumber: m.weekNumber,
    title: m.title,
    summary: m.summary,
    status: backendStatusToFaculty(m.status),
    lessonsCount: m.lessons?.length ?? m.lessonCount ?? 0,
    enrolledFellows: 0, // backend doesn't compute this yet
    averageAssessmentScore: null,
    lastEditedAt: m.updatedAt,
  };
}

export function backendToModuleDetail(m: BackendModule): FacultyModuleDetail {
  return {
    ...backendToModuleSummary(m),
    lessons: m.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      summary: l.summary,
      kind: l.kind,
      durationMinutes: l.durationMinutes,
      contentUrl: l.contentUrl ?? null,
      contentMimeType: l.contentMimeType ?? null,
      contentBytes: l.contentBytes ?? null,
    })),
    resources: (m.resources ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      kind: r.kind,
      url: r.url,
      description: r.description ?? "",
      tags: r.tags ?? [],
      featured: r.featured ?? false,
      durationMinutes: r.durationMinutes ?? 0,
    })),
    assessment: m.assessment
      ? {
          id: m.assessment.id,
          title: m.assessment.title,
          questionCount: m.assessment.questionCount,
          passingScore: m.assessment.passingScore,
          averageScore: null,
          exists: true,
          questions: m.assessment.questions.map((q) => ({
            id: q.id,
            prompt: q.prompt,
            kind: q.kind,
            choices: q.choices,
            maxLength: q.maxLength,
          })),
        }
      : {
          // Backend hasn't materialised the assessment yet — first question
          // creates the row. Use a stable placeholder id keyed off the module.
          id: `assess-pending-${m.id}`,
          title: `Week ${m.weekNumber} assessment`,
          questionCount: 0,
          passingScore: 70,
          averageScore: null,
          exists: false,
          questions: [],
        },
    session: m.session
      ? {
          id: m.session.id,
          title: m.session.title,
          startsAt: m.session.startsAt,
          durationMinutes: m.session.durationMinutes,
          attendanceThresholdMinutes: m.session.attendanceThresholdMinutes,
          joinUrl: m.session.joinUrl,
          zoomMeetingId: m.session.zoomMeetingId,
          status: m.session.status,
          host: m.session.host,
        }
      : null,
    publishedAt: m.publishedAt,
  };
}

/* ---------- Client-side mutators (run in the browser via the BFF) ---------- */

/** Create a new module under a course (admin / faculty). */
export async function createModule(payload: {
  courseId: string;
  weekNumber: number;
  title: string;
  summary: string;
}): Promise<FacultyModuleDetail> {
  const data = await apiFetch<{ module: BackendModule }>("/modules", {
    method: "POST",
    body: payload,
  });
  return backendToModuleDetail(data.module);
}

/** Save the editable draft fields on a module. */
export async function saveModuleDraft(
  moduleId: string,
  patch: Partial<{ title: string; summary: string; weekNumber: number }>,
): Promise<FacultyModuleDetail> {
  const data = await apiFetch<{ module: BackendModule }>(
    `/modules/${encodeURIComponent(moduleId)}`,
    { method: "PATCH", body: patch },
  );
  return backendToModuleDetail(data.module);
}

/** Faculty submits a draft for admin review. */
export async function submitModuleForReview(
  moduleId: string,
): Promise<FacultyModuleDetail> {
  const data = await apiFetch<{ module: BackendModule }>(
    `/modules/${encodeURIComponent(moduleId)}/submit-for-review`,
    { method: "POST" },
  );
  return backendToModuleDetail(data.module);
}

/** Admin approves a submission and publishes it. */
export async function approveModule(
  moduleId: string,
): Promise<FacultyModuleDetail> {
  const data = await apiFetch<{ module: BackendModule }>(
    `/modules/${encodeURIComponent(moduleId)}/publish`,
    { method: "POST" },
  );
  return backendToModuleDetail(data.module);
}

/** Admin returns a submission to draft, with the admin's return note. */
export async function returnModule(
  moduleId: string,
  note?: string,
): Promise<FacultyModuleDetail> {
  const data = await apiFetch<{ module: BackendModule }>(
    `/modules/${encodeURIComponent(moduleId)}/return`,
    { method: "POST", body: note ? { note } : undefined },
  );
  return backendToModuleDetail(data.module);
}

/** Permanently delete a module + its lessons. */
export async function deleteModule(moduleId: string): Promise<void> {
  await apiFetch<void>(`/modules/${encodeURIComponent(moduleId)}`, {
    method: "DELETE",
  });
}

/* ---------- Lessons (BRD §6.3) ---------- */

export type UpsertLessonPayload = {
  title: string;
  summary: string;
  kind: FacultyLessonKind;
  durationMinutes: number;
};

function backendToFacultyLesson(l: BackendLesson): FacultyLesson {
  return {
    id: l.id,
    title: l.title,
    summary: l.summary,
    kind: l.kind,
    durationMinutes: l.durationMinutes,
    contentUrl: l.contentUrl ?? null,
    contentMimeType: l.contentMimeType ?? null,
    contentBytes: l.contentBytes ?? null,
  };
}

export async function addModuleLesson(
  moduleId: string,
  payload: UpsertLessonPayload,
): Promise<FacultyLesson> {
  const data = await apiFetch<{ lesson: BackendLesson }>(
    `/modules/${encodeURIComponent(moduleId)}/lessons`,
    { method: "POST", body: payload },
  );
  return backendToFacultyLesson(data.lesson);
}

export async function updateLesson(
  lessonId: string,
  payload: UpsertLessonPayload,
): Promise<FacultyLesson> {
  const data = await apiFetch<{ lesson: BackendLesson }>(
    `/lessons/${encodeURIComponent(lessonId)}`,
    { method: "PATCH", body: payload },
  );
  return backendToFacultyLesson(data.lesson);
}

export async function deleteLesson(lessonId: string): Promise<void> {
  await apiFetch<void>(`/lessons/${encodeURIComponent(lessonId)}`, {
    method: "DELETE",
  });
}

/* ---------- Lesson content upload (DigitalOcean Spaces) ---------- */

/**
 * Hard limits — kept in sync with the backend's signature endpoint.
 * Anything beyond these values is rejected before we even hit the
 * network, so users get a fast local error instead of an opaque
 * upload-failed-after-200MB.
 */
export const LESSON_UPLOAD_MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB — mirror of backend cap
export const LESSON_UPLOAD_ALLOWED_MIME = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export type LessonUploadMime = (typeof LESSON_UPLOAD_ALLOWED_MIME)[number];

export function isAllowedLessonMime(mime: string): mime is LessonUploadMime {
  return (LESSON_UPLOAD_ALLOWED_MIME as readonly string[]).includes(mime);
}

/**
 * Step 1 — ask the backend to mint a presigned PUT URL we can upload
 * the file's bytes directly to.
 *
 * The frontend never sees the Spaces secret; the backend signs server-
 * side using the credentials in its `.env`. The returned `uploadUrl`
 * is single-use and short-lived (5 min by default). Byte transfer
 * itself goes through the shared `uploadFileToSignedUrl` helper.
 */
export async function getLessonUploadUrl(
  lessonId: string,
  payload: { mimeType: LessonUploadMime; bytes: number; filename: string },
): Promise<SignedUploadResponse> {
  return apiFetch<SignedUploadResponse>(
    `/lessons/${encodeURIComponent(lessonId)}/upload-url`,
    { method: "POST", body: payload },
  );
}

// `uploadFileToSignedUrl` lives in `lib/api/uploads.ts` so both lesson
// uploads (here) and assessment-answer uploads (in `attempts.ts`)
// share the byte-transfer + progress wiring. Re-exported for callers
// that import everything from `faculty.ts`.
export { uploadFileToSignedUrl };

/**
 * Step 3 — once the bytes are in Spaces, tell the backend to attach
 * the `publicUrl` to the lesson record. Done in a separate call so
 * a partial upload never leaves a half-attached lesson row.
 */
export async function attachLessonContent(
  lessonId: string,
  payload: { contentUrl: string; contentMimeType: string; contentBytes: number },
): Promise<FacultyLesson> {
  const data = await apiFetch<{ lesson: BackendLesson }>(
    `/lessons/${encodeURIComponent(lessonId)}/content`,
    { method: "PATCH", body: payload },
  );
  return backendToFacultyLesson(data.lesson);
}

/**
 * Convenience wrapper — uploads a lesson's content file and returns
 * the updated lesson. The single function the lesson editor UI calls.
 *
 * Three-step browser → Spaces direct upload:
 *   1. Backend mints a presigned PUT URL (size + mime baked into the
 *      signature so the browser can't deviate).
 *   2. Browser PUTs the file bytes straight to Spaces. Bypasses both
 *      Vercel's 4.5 MB body cap and DO App Platform's request-body
 *      limit — that's the only architecture that handles 500 MB videos.
 *   3. Backend attaches the resulting public URL + metadata to the
 *      Lesson row. Done in a separate call so a partial upload (bytes
 *      in the bucket, browser tab closed) never leaves a half-attached
 *      lesson row the fellow viewer would render as broken.
 *
 * The backend-proxied alternative (`/lessons/:id/upload-direct`) is
 * still wired up as a fallback — useful for environments where direct
 * Spaces access isn't viable. It's not the default path.
 */
export async function uploadLessonContent(
  lessonId: string,
  file: File,
  options: { onProgress?: (loaded: number, total: number) => void } = {},
): Promise<FacultyLesson> {
  if (!isAllowedLessonMime(file.type)) {
    throw new Error(
      `Unsupported file type: ${file.type || "unknown"}. Allowed: video, PDF, or image.`,
    );
  }
  if (file.size > LESSON_UPLOAD_MAX_BYTES) {
    throw new Error(
      `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 500 MB.`,
    );
  }
  const signed = await getLessonUploadUrl(lessonId, {
    mimeType: file.type,
    bytes: file.size,
    filename: file.name,
  });
  await uploadFileToSignedUrl(signed.uploadUrl, file, options);
  return attachLessonContent(lessonId, {
    contentUrl: signed.publicUrl,
    contentMimeType: file.type,
    contentBytes: file.size,
  });
}

export async function reorderLesson(
  lessonId: string,
  payload: { beforeId: string | null; afterId: string | null },
): Promise<void> {
  await apiFetch<void>(`/lessons/${encodeURIComponent(lessonId)}/reorder`, {
    method: "POST",
    body: payload,
  });
}

/* ---------- Module resources (BRD §6.3) ---------- */

export type UpsertResourcePayload = {
  title: string;
  url: string;
  kind: FacultyResource["kind"];
  description?: string;
  tags?: string[];
  featured?: boolean;
  durationMinutes?: number;
};

function backendToFacultyResource(r: BackendResource): FacultyResource {
  return {
    id: r.id,
    title: r.title,
    url: r.url,
    kind: r.kind,
    description: r.description ?? "",
    tags: r.tags ?? [],
    featured: r.featured ?? false,
    durationMinutes: r.durationMinutes ?? 0,
  };
}

export async function addModuleResource(
  moduleId: string,
  payload: UpsertResourcePayload,
): Promise<FacultyResource> {
  const data = await apiFetch<{ resource: BackendResource }>(
    `/modules/${encodeURIComponent(moduleId)}/resources`,
    { method: "POST", body: payload },
  );
  return backendToFacultyResource(data.resource);
}

export async function updateModuleResource(
  resourceId: string,
  payload: UpsertResourcePayload,
): Promise<FacultyResource> {
  const data = await apiFetch<{ resource: BackendResource }>(
    `/resources/${encodeURIComponent(resourceId)}`,
    { method: "PATCH", body: payload },
  );
  return backendToFacultyResource(data.resource);
}

export async function deleteModuleResource(resourceId: string): Promise<void> {
  await apiFetch<void>(`/resources/${encodeURIComponent(resourceId)}`, {
    method: "DELETE",
  });
}

/* ---------- Assessment questions (BRD §6.5) ---------- */

export type UpsertQuestionPayload = {
  prompt: string;
  kind: AssessmentQuestionKind;
  /** Required only when kind = "multiple_choice"; ignored otherwise. */
  choices?: { text: string; isCorrect: boolean }[];
  /** Cap for short_text / essay answers. Ignored for MC and attachment. */
  maxLength?: number | null;
};

export async function addAssessmentQuestion(
  moduleId: string,
  payload: UpsertQuestionPayload,
): Promise<AssessmentQuestion> {
  const data = await apiFetch<{ question: BackendQuestion }>(
    `/modules/${encodeURIComponent(moduleId)}/questions`,
    { method: "POST", body: payload },
  );
  return {
    id: data.question.id,
    prompt: data.question.prompt,
    kind: data.question.kind,
    choices: data.question.choices,
    maxLength: data.question.maxLength,
  };
}

export async function updateAssessmentQuestion(
  questionId: string,
  payload: UpsertQuestionPayload,
): Promise<AssessmentQuestion> {
  const data = await apiFetch<{ question: BackendQuestion }>(
    `/questions/${encodeURIComponent(questionId)}`,
    { method: "PATCH", body: payload },
  );
  return {
    id: data.question.id,
    prompt: data.question.prompt,
    kind: data.question.kind,
    choices: data.question.choices,
    maxLength: data.question.maxLength,
  };
}

export async function deleteAssessmentQuestion(
  questionId: string,
): Promise<void> {
  await apiFetch<void>(`/questions/${encodeURIComponent(questionId)}`, {
    method: "DELETE",
  });
}

/* ---------- Live session (BRD §6.4) ---------- */

export type UpsertSessionPayload = {
  title: string;
  /** ISO timestamp. */
  startsAt: string;
  durationMinutes: number;
  attendanceThresholdMinutes?: number;
  joinUrl?: string;
  /** Numeric Zoom meeting id (as a string) for in-app embedding. */
  zoomMeetingId?: string;
};

/** Create or update the session for a module. Faculty/admin only. */
export async function upsertModuleSession(
  moduleId: string,
  payload: UpsertSessionPayload,
): Promise<FacultySession> {
  const data = await apiFetch<{
    session: {
      id: string;
      moduleId: string;
      title: string;
      startsAt: string;
      durationMinutes: number;
      attendanceThresholdMinutes: number;
      joinUrl: string | null;
      status: "scheduled" | "live" | "ended" | "cancelled";
      host: { id: string; fullName: string } | null;
      myAttendance: unknown;
    };
  }>(`/modules/${encodeURIComponent(moduleId)}/session`, {
    method: "POST",
    body: payload,
  });
  return {
    id: data.session.id,
    title: data.session.title,
    startsAt: data.session.startsAt,
    durationMinutes: data.session.durationMinutes,
    attendanceThresholdMinutes: data.session.attendanceThresholdMinutes,
    joinUrl: data.session.joinUrl,
    zoomMeetingId: payload.zoomMeetingId ?? null,
    status: data.session.status,
    host: data.session.host,
  };
}

/** Permanently remove a session. */
export async function deleteSession(sessionId: string): Promise<void> {
  await apiFetch<void>(`/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
}
