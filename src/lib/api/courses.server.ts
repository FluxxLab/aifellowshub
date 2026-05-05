/**
 * Server-only course readers. Uses `next/headers` (via `backendFetch`);
 * only import from server pages. Returns `[]` / `null` when the backend
 * is unreachable.
 */
import { backendFetch } from "./backend";
import {
  backendToCourse,
  backendToCourseDetail,
  type BackendCourse,
  type BackendCourseDetail,
  type Course,
  type CourseDetail,
} from "./courses";

export async function getCourses(): Promise<Course[]> {
  try {
    const res = await backendFetch("/courses", { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as { courses: BackendCourse[] };
    return data.courses.map(backendToCourse);
  } catch {
    return [];
  }
}

export async function getCourseDetail(
  id: string,
): Promise<CourseDetail | null> {
  try {
    const res = await backendFetch(`/courses/${encodeURIComponent(id)}`, {
      method: "GET",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { course: BackendCourseDetail };
    return backendToCourseDetail(data.course);
  } catch {
    return null;
  }
}
