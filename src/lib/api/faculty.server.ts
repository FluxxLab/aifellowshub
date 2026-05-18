/**
 * Server-only faculty readers. Uses `next/headers` (via `backendFetch`)
 * so they can only be imported from server components and route handlers.
 * Client components must keep their imports limited to `./faculty`
 * (types + client mutators).
 */
import "server-only";
import { backendFetch } from "./backend";
import {
  backendToModuleDetail,
  backendToModuleSummary,
  type BackendModule,
  type FacultyHome,
  type FacultyModuleDetail,
  type FacultyModuleSummary,
  type FacultyReviewItem,
} from "./faculty";

/* ---------- Faculty's own modules ---------- */

const EMPTY_HOME: FacultyHome = {
  modulesOwned: 0,
  modulesPublished: 0,
  modulesInDraft: 0,
  modulesUnderReview: 0,
  activeFellows: 0,
  averageScore: null,
  recentActivity: [],
};

/**
 * Faculty home metrics — backend doesn't aggregate this surface yet, so
 * the page renders a zero-state until a `/faculty/me/home` endpoint lands.
 */
export async function getFacultyHome(): Promise<FacultyHome> {
  return EMPTY_HOME;
}

export async function getFacultyModules(): Promise<FacultyModuleSummary[]> {
  try {
    const res = await backendFetch("/modules", { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as { modules: BackendModule[] };
    return data.modules.map(backendToModuleSummary);
  } catch {
    return [];
  }
}

export async function getFacultyModule(
  id: string,
): Promise<FacultyModuleDetail | null> {
  try {
    const res = await backendFetch(`/modules/${encodeURIComponent(id)}`, {
      method: "GET",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { module: BackendModule };
    return backendToModuleDetail(data.module);
  } catch {
    return null;
  }
}

/* ---------- Admin's review queue ---------- */

function backendToReviewItem(m: BackendModule): FacultyReviewItem {
  const detail = backendToModuleDetail(m);
  return {
    id: m.id,
    moduleId: m.id,
    moduleTitle: m.title,
    moduleSummary: m.summary,
    weekNumber: m.weekNumber,
    kind: m.publishedAt ? "revision" : "new",
    submittedBy: { id: m.courseId, name: "Faculty submission" },
    submittedAt: m.submittedAt ?? m.updatedAt,
    detail,
  };
}

export async function getFacultyReviewQueue(): Promise<FacultyReviewItem[]> {
  try {
    const res = await backendFetch("/modules?status=under_review", {
      method: "GET",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { modules: BackendModule[] };
    return data.modules.map(backendToReviewItem);
  } catch {
    return [];
  }
}

export async function getFacultyReviewItem(
  id: string,
): Promise<FacultyReviewItem | null> {
  try {
    const res = await backendFetch(`/modules/${encodeURIComponent(id)}`, {
      method: "GET",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { module: BackendModule };
    return backendToReviewItem(data.module);
  } catch {
    return null;
  }
}
