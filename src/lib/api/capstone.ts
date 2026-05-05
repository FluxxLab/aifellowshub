/**
 * Capstone — admin oversight types (BRD §6.10). Reads run through
 * `capstone.server.ts` (`GET /capstones`, admin-only).
 */

export type CapstoneStatus =
  | "draft"
  | "submitted"
  | "under-review"
  | "revision-required"
  | "approved";

export type CapstoneSubmission = {
  id: string;
  fellowId: string;
  fellowName: string;
  mentorId: string | null;
  mentorName: string | null;
  /** Sector or topic the capstone addresses. */
  sector: string;
  title: string | null;
  description: string;
  submissionUrl: string | null;
  fileUrl: string | null;
  /** Submission version (BRD §6.10 — fellow can resubmit). */
  version: number;
  status: CapstoneStatus;
  submittedAt: string | null;
  /** Timestamp of last fellow- or mentor-side change. */
  lastActivityAt: string;
  /** Days since last activity. Used for the "stuck" indicator. */
  daysSinceActivity: number;
};

/** Computed: a capstone is "overdue" if it's awaiting mentor review for too long. */
export function isOverdue(s: CapstoneSubmission, threshold = 7): boolean {
  return (
    (s.status === "submitted"|| s.status === "under-review") &&
    s.daysSinceActivity >= threshold
  );
}

