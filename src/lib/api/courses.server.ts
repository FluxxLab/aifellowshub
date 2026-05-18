/**
 * Server-only course readers. Uses `next/headers` (via `backendFetch`);
 * only import from server pages. Returns `[]` / `null` when the backend
 * is unreachable.
 */
import "server-only";
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
    if (!res.ok) {
      // Log the backend's status + reason so a notFound() on the page
      // is traceable. Without this the page just 404s with no breadcrumb
      // about whether it was a 401 / 403 / 404 / 500 from upstream.
      const body = await res.text().catch(() => "");
      console.warn(
        `[courses.server] getCourseDetail(${id}) → backend ${res.status}: ${body.slice(0, 200)}`,
      );
      return null;
    }
    const data = (await res.json()) as { course: BackendCourseDetail };
    return backendToCourseDetail(data.course);
  } catch (err) {
    console.warn(
      `[courses.server] getCourseDetail(${id}) threw: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return null;
  }
}
