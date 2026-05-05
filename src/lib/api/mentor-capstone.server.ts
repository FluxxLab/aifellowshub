/**
 * Server-only mentor capstone fetchers (BRD §6.10). Maps backend
 * `Capstone` payloads into mentor-side shapes.
 */
import "server-only";
import { backendFetch } from "./backend";
import type {
  CapstoneSector,
  CapstoneStatus,
  FellowCapstone,
  MentorQueueEntry,
} from "./fellow-capstone";
import type { BackendCapstone } from "./fellow-capstone.server";

export async function getMentorQueueServer(): Promise<MentorQueueEntry[]> {
  try {
    const res = await backendFetch("/mentor/capstones", { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as { capstones: BackendCapstone[] };
    return (data.capstones ?? []).map(mapToQueueEntry);
  } catch {
    return [];
  }
}

export type MentorCapstoneView = FellowCapstone & { backendId: string };

/**
 * Single capstone for the mentor's review page. The route uses fellowId
 * as its param; we fetch the queue and pick the matching entry's full
 * payload, since there's no direct GET-by-fellow endpoint yet.
 */
export async function getMentorCapstoneServer(
  fellowId: string,
): Promise<MentorCapstoneView | null> {
  try {
    const res = await backendFetch("/mentor/capstones", { method: "GET" });
    if (!res.ok) return null;
    const data = (await res.json()) as { capstones: BackendCapstone[] };
    const match = data.capstones.find((c) => c.fellow?.id === fellowId);
    if (!match) return null;
    return {
      backendId: match.id,
      status: mapBackendStatus(match.status),
      title:
        match.title === "Untitled capstone" ? "Untitled capstone" : match.title,
      oneliner: match.problemStatement.split("\n")[0]?.trim() || "",
      sector: mapSector(match.fellow?.sector ?? match.sector),
      mentor: match.mentor
        ? {
            id: match.mentor.id,
            fullName: match.mentor.fullName,
            email: match.mentor.email,
            expertiseSummary: "",
          }
        : {
            id: "",
            fullName: "Mentor not assigned",
            email: "",
            expertiseSummary: "",
          },
      draft: {
        problem: match.problemStatement,
        approach: match.content,
        stakeholders: "",
        deliverables: "",
        risks: "",
        lastSavedAt: match.updatedAt,
      },
      milestones: [],
      consultations: [],
      feedback: match.feedback.map((f) => ({
        id: f.id,
        fromMentor: f.author.role !== "fellow",
        fromName: f.author.fullName,
        message: f.message,
        at: f.createdAt,
      })),
      assignments: [],
      submittedAt: match.lastSubmittedAt,
      approvedAt: match.finalApprovedAt,
    };
  } catch {
    return null;
  }
}

function mapBackendStatus(s: BackendCapstone["status"]): CapstoneStatus {
  switch (s) {
    case "draft":
      return "draft";
    case "under_review":
      return "under-review";
    case "needs_revision":
      return "returned";
    case "approved":
      return "approved";
  }
}

function mapToQueueEntry(c: BackendCapstone): MentorQueueEntry {
  const status: CapstoneStatus =
    c.status === "draft"
      ? "draft"
      : c.status === "under_review"
      ? "under-review"
      : c.status === "needs_revision"
      ? "returned"
      : "approved";
  return {
    fellowId: c.fellow?.id ?? "",
    fellowName: c.fellow?.fullName ?? "Unknown fellow",
    fellowEmail: c.fellow?.email ?? "",
    fellowCountry: c.fellow?.country ?? "—",
    sector: mapSector(c.fellow?.sector ?? c.sector),
    capstoneTitle: c.title === "Untitled capstone" ? null : c.title,
    status,
    lastActivityAt: c.updatedAt,
    awaitingMentorReply: c.status === "under_review",
    unreadFromFellow: c.status === "under_review" ? 1 : 0,
  };
}

function mapSector(s: string | null | undefined): CapstoneSector {
  if (!s) return "Other";
  const norm = s.toLowerCase();
  if (norm.includes("health")) return "Health AI";
  if (norm.includes("ed")) return "EdTech";
  if (norm.includes("agric")) return "Agriculture";
  if (norm.includes("fin")) return "Fintech";
  if (norm.includes("gov")) return "Governance";
  return "Other";
}
