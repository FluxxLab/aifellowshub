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
      stage: match.stage,
      title:
        match.title === "Untitled capstone" ? "Untitled capstone" : match.title,
      // A short teaser, not the whole statement. PDF-imported problem
      // statements arrive as one long line with no newlines, so splitting on
      // "\n" alone would put the entire document here — cap the length and cut
      // at a word boundary with an ellipsis.
      oneliner: (() => {
        const firstLine = match.problemStatement.split("\n")[0]?.trim() || "";
        const MAX = 160;
        if (firstLine.length <= MAX) return firstLine;
        const cut = firstLine.slice(0, MAX);
        const lastSpace = cut.lastIndexOf(" ");
        return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
      })(),
      // FellowCapstone requires a non-null sector — fall back to the
      // EID sentinel only on this single-capstone surface; the queue
      // tally below uses the honest nullable result.
      sector:
        mapSector(match.fellow?.sector ?? match.sector) ??
        "Economic Inclusion Development",
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
      milestones: match.milestones ?? [],
      feedback: match.feedback.map((f) => ({
        id: f.id,
        fromMentor: f.author.role !== "fellow",
        fromName: f.author.fullName,
        message: f.message,
        at: f.createdAt,
      })),
      submittedAt: match.lastSubmittedAt,
      approvedAt: match.finalApprovedAt,
      artifactUrl: match.artifactUrl ?? null,
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

function mapSector(s: string | null | undefined): CapstoneSector | null {
  // Backend stores the canonical lowercase enum tokens. Match them
  // exactly — the older `.includes("ed")` matched too broadly (any
  // word containing "ed"), and unset sectors defaulted silently to
  // "Economic Inclusion Development" which made the queue mis-tally.
  if (!s) return null;
  switch (s.trim().toLowerCase()) {
    case "healthcare":
      return "Healthcare";
    case "edtech":
      return "Education";
    case "agriculture":
      return "Agriculture";
    case "economic_inclusion_development":
    case "economic inclusion development":
      return "Economic Inclusion Development";
    default:
      return null;
  }
}
