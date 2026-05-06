/**
 * Server-only admin capstone oversight fetcher (BRD §6.10). Maps backend
 * capstone payloads to the admin-side `CapstoneSubmission` shape.
 * Returns `[]` when the backend is unreachable.
 */
import "server-only";
import { backendFetch } from "./backend";
import type { CapstoneStatus, CapstoneSubmission } from "./capstone";
import type { BackendCapstone } from "./fellow-capstone.server";

export async function getCapstoneSubmissionsServer(): Promise<CapstoneSubmission[]> {
  try {
    const res = await backendFetch("/capstones", { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as { capstones: BackendCapstone[] };
    return (data.capstones ?? []).map(mapToSubmission);
  } catch {
    return [];
  }
}

function mapToSubmission(c: BackendCapstone): CapstoneSubmission {
  const status: CapstoneStatus =
    c.status === "draft"
      ? "draft"
      : c.status === "under_review"
      ? "under-review"
      : c.status === "needs_revision"
      ? "revision-required"
      : "approved";
  const lastActivityAt = c.updatedAt;
  const daysSinceActivity = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
  return {
    id: c.id,
    fellowId: c.fellow?.id ?? "",
    fellowName: c.fellow?.fullName ?? "Unknown fellow",
    mentorId: c.mentor?.id ?? null,
    mentorName: c.mentor?.fullName ?? null,
    sector: c.sector ?? c.fellow?.sector ?? "Economic Inclusion Development",
    title: c.title === "Untitled capstone" ? null : c.title,
    description: c.problemStatement,
    submissionUrl: c.draftUrl,
    fileUrl: c.artifactUrl,
    version: 1, // backend doesn't track versions yet
    status,
    submittedAt: c.lastSubmittedAt,
    lastActivityAt,
    daysSinceActivity,
  };
}
