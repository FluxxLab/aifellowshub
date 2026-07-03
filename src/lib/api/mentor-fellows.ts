import { apiFetch } from "./client";

export type MentorFellowVia = "pinned" | "sector";

export type MentorAssignedFellow = {
  id: string;
  fullName: string;
  email: string;
  sector: string | null;
  via: MentorFellowVia;
};

export type MentorAvailableFellow = {
  id: string;
  fullName: string;
  email: string;
  sector: string | null;
};

export type MentorFellowsPayload = {
  mentor: { id: string; fullName: string; sector: string | null };
  assigned: MentorAssignedFellow[];
  available: MentorAvailableFellow[];
};

/** Fellows under a mentor's care (pinned + sector) and fellows available to pin. */
export function getMentorFellows(mentorId: string) {
  return apiFetch<MentorFellowsPayload>(
    `/admin/mentors/${encodeURIComponent(mentorId)}/fellows`,
  );
}

/** Pin a set of fellows to a mentor (bulk override). */
export function assignFellowsToMentor(mentorId: string, fellowIds: string[]) {
  return apiFetch<{ assigned: number }>(
    `/admin/mentors/${encodeURIComponent(mentorId)}/fellows`,
    { method: "POST", body: { fellowIds } },
  );
}

/** Unpin a fellow from a mentor — reverts them to sector auto-match. */
export function unassignFellowFromMentor(mentorId: string, fellowId: string) {
  return apiFetch<{ ok: true }>(
    `/admin/mentors/${encodeURIComponent(mentorId)}/fellows/${encodeURIComponent(fellowId)}`,
    { method: "DELETE" },
  );
}
