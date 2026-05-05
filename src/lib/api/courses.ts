/**
 * Courses — types + client-safe mutators (BRD §6.3).
 *
 * Server-side readers live in `courses.server.ts` (they need `next/headers`
 * for cookie forwarding). Client components must NOT import the server file.
 */
import { apiFetch } from "./client";

export type Course = {
  id: string;
  title: string;
  description: string;
  /** Faculty member who owns and curates this course. */
  ownerId: string;
  ownerName: string;
  /** Total modules in this course. */
  moduleCount: number;
  /** How many of those modules are currently published (visible to fellows). */
  publishedModuleCount: number;
  isPublished: boolean;
  /** ISO timestamp. */
  createdAt: string;
  /** ISO timestamp. */
  updatedAt: string;
};

/* ---------- Modules + course detail (BRD §6.3) ---------- */

export type UnlockCondition = "session-attended-or-assessment-passed" | "always";

export type Module = {
  id: string;
  courseId: string;
  title: string;
  weekNumber: number;
  category: string;
  summary: string;
  learningObjectives: string[];
  keyActivities: string[];
  /** Linked LiveSession id, or null if not yet scheduled. */
  linkedSessionId: string | null;
  unlockCondition: UnlockCondition;
  orderIndex: number;
  isPublished: boolean;
  updatedAt: string;
};

export type CourseDetail = Course & {
  modules: Module[];
};

/* ---------- Backend response shapes + mappers ---------- */

export type BackendCourse = {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  moduleCount: number;
  publishedModuleCount: number;
  createdAt: string;
  updatedAt: string;
};

export type BackendCourseModuleSummary = {
  id: string;
  weekNumber: number;
  title: string;
  summary: string;
  status: "draft" | "under_review" | "published";
  orderIndex: number;
  lessonCount: number;
};

export type BackendCourseDetail = BackendCourse & {
  modules?: BackendCourseModuleSummary[];
};

export function backendToCourse(c: BackendCourse): Course {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    ownerId: c.ownerId,
    ownerName: c.ownerName ?? "Unassigned",
    moduleCount: c.moduleCount,
    publishedModuleCount: c.publishedModuleCount,
    isPublished: c.isPublished,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export function backendModuleSummaryToModule(
  m: BackendCourseModuleSummary,
  courseId: string,
): Module {
  return {
    id: m.id,
    courseId,
    title: m.title,
    weekNumber: m.weekNumber,
    category: "AI Ethics", // backend doesn't track category yet — placeholder
    summary: m.summary,
    learningObjectives: [],
    keyActivities: [],
    linkedSessionId: null,
    unlockCondition: "session-attended-or-assessment-passed",
    orderIndex: m.orderIndex,
    isPublished: m.status === "published",
    updatedAt: new Date().toISOString(),
  };
}

export function backendToCourseDetail(c: BackendCourseDetail): CourseDetail {
  return {
    ...backendToCourse(c),
    modules: (c.modules ?? []).map((m) => backendModuleSummaryToModule(m, c.id)),
  };
}

/* ---------- Client-side mutators ---------- */

export type CreateCoursePayload = {
  title: string;
  description: string;
  ownerId?: string;
};

export async function createCourse(payload: CreateCoursePayload): Promise<Course> {
  const data = await apiFetch<{ course: BackendCourse }>("/courses", {
    method: "POST",
    body: payload,
  });
  return backendToCourse(data.course);
}

export type UpdateCoursePayload = {
  title?: string;
  description?: string;
  isPublished?: boolean;
};

export async function updateCourse(
  id: string,
  payload: UpdateCoursePayload,
): Promise<Course> {
  const data = await apiFetch<{ course: BackendCourse }>(
    `/courses/${encodeURIComponent(id)}`,
    { method: "PATCH", body: payload },
  );
  return backendToCourse(data.course);
}

export async function deleteCourse(id: string): Promise<void> {
  await apiFetch<void>(`/courses/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
