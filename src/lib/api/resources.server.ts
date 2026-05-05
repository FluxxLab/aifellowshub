/**
 * Server-only admin resources fetcher (BRD §6.9). Maps the backend
 * `/resources` aggregate to the existing `Resource` shape the admin page
 * renders. Returns `[]` when the backend is unreachable.
 */
import "server-only";
import { backendFetch } from "./backend";
import type { Resource, ResourceType } from "./resources";

type BackendResource = {
  id: string;
  title: string;
  description: string;
  kind: "pdf" | "link" | "video";
  url: string;
  tags: string[];
  featured: boolean;
  durationMinutes: number;
  module: {
    id: string;
    title: string;
    weekNumber: number;
    course: {
      id: string;
      title: string;
      owner: { id: string; fullName: string } | null;
    };
  } | null;
  createdAt: string;
  updatedAt: string;
};

export async function getResourcesServer(): Promise<Resource[]> {
  try {
    const res = await backendFetch("/resources", { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as { resources: BackendResource[] };
    return (data.resources ?? []).map(mapResource);
  } catch {
    return [];
  }
}

function mapResource(r: BackendResource): Resource {
  const type: ResourceType =
    r.kind === "pdf" ? "pdf" : r.kind === "video" ? "video" : "article";
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    type,
    url: r.url,
    moduleId: r.module?.id ?? null,
    moduleTitle: r.module?.title ?? null,
    weekNumber: r.module?.weekNumber ?? null,
    tags: r.tags,
    createdById: r.module?.course.owner?.id ?? "",
    createdByName: r.module?.course.owner?.fullName ?? "Unknown",
    bookmarkCount: 0,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
