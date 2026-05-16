/**
 * Resource library — admin types (BRD §6.9). Faculty manage resources via
 * `/faculty/modules/[id]`; the admin aggregate view returns empty until a
 * `/resources` admin endpoint lands. Fellows read via `/me/resources`.
 */

export type ResourceType =
  | "article"
  | "pdf"
  | "video"
  | "tool"
  | "dataset"
  | "other";

export type Resource = {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  url: string;
  /** Module this resource is attached to, or null for general resources. */
  moduleId: string | null;
  moduleTitle: string | null;
  weekNumber: number | null;
  tags: string[];
  createdById: string;
  createdByName: string;
  /** Number of fellows who've bookmarked this resource. */
  bookmarkCount: number;
  createdAt: string;
  updatedAt: string;
};

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  article: "Article",
  pdf: "PDF",
  video: "Video",
  tool: "Tool",
  dataset: "Dataset",
  other: "Other",
};

export async function getResources(): Promise<Resource[]> {
  return [];
}

/* ---------- mutations (admin / faculty / owning module) ---------- */

import { apiFetch } from "./client";

/** Backend's ResourceKind only knows pdf/link/video — collapse the others. */
export function toBackendKind(t: ResourceType): "pdf" | "link" | "video" {
  if (t === "pdf") return "pdf";
  if (t === "video") return "video";
  return "link";
}

export type UpdateResourcePayload = {
  title?: string;
  url?: string;
  kind?: "pdf" | "link" | "video";
  description?: string;
  tags?: string[];
  /** Move the resource to a different module (admin-only). */
  moduleId?: string;
};

/**
 * PATCH /resources/:id — admin / faculty / owning-module only (per
 * the backend's `@Roles` decorators). Returns nothing meaningful;
 * caller refetches via `router.refresh()`.
 */
export async function updateResource(
  id: string,
  payload: UpdateResourcePayload,
): Promise<void> {
  await apiFetch(`/resources/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
  });
}

/** DELETE /resources/:id — same role gate. Idempotent on the server. */
export async function deleteResource(id: string): Promise<void> {
  await apiFetch(`/resources/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

import type { SignedUploadResponse } from "./uploads";
export async function getResourceUploadUrl(
  moduleId: string,
  file: File,
): Promise<SignedUploadResponse> {
  return apiFetch<SignedUploadResponse>(
    `/modules/${encodeURIComponent(moduleId)}/resources/upload-url`,
    {
      method: "POST",
      body: {
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        bytes: file.size,
      },
    },
  );
}
