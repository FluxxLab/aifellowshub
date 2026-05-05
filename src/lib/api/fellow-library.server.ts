/**
 * Server-only fellow library fetcher (BRD §6.9). Maps the backend's
 * aggregate resource endpoint into the existing `LibraryResource` shape.
 * Returns `[]` when the backend is unreachable.
 */
import "server-only";
import { backendFetch } from "./backend";
import type { LibraryResource, ResourceKind } from "./fellow-library";

type BackendLibraryResource = {
  id: string;
  title: string;
  url: string;
  kind: "pdf" | "link" | "video";
  description: string;
  tags: string[];
  featured: boolean;
  durationMinutes: number;
  source: {
    weekNumber: number;
    moduleTitle: string;
    moduleId: string;
  } | null;
};

export async function getLibraryServer(): Promise<LibraryResource[]> {
  try {
    const res = await backendFetch("/me/resources", { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as { resources: BackendLibraryResource[] };
    return (data.resources ?? []).map(mapBackendResource);
  } catch {
    return [];
  }
}

function mapBackendResource(b: BackendLibraryResource): LibraryResource {
  // The library shape includes a "dataset" kind that the backend doesn't
  // model — collapse it to "link" for now.
  const kind: ResourceKind =
    b.kind === "pdf" || b.kind === "link" || b.kind === "video"
      ? b.kind
      : "link";
  return {
    id: b.id,
    title: b.title,
    description: b.description || `Resource from Week ${b.source?.weekNumber ?? "?"}`,
    kind,
    url: b.url,
    source: b.source
      ? {
          weekNumber: b.source.weekNumber,
          moduleTitle: b.source.moduleTitle,
        }
      : null,
    tags: b.tags ?? [],
    featured: b.featured,
    durationMinutes: b.durationMinutes,
  };
}
