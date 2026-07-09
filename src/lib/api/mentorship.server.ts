/**
 * Server-side fetchers for the mentorship coaching surface. Return null
 * (or empty list) when the backend is unreachable so pages render an
 * empty state instead of crashing.
 */
import { backendFetch } from "./backend";
import type {
  AdminBooking,
  FellowBooking,
  MentorBooking,
  MentorSummary,
} from "./mentorship";

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await backendFetch(path, { method: "GET" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Staff-only — full mentor roster for admin queue context. */
export async function listMentorsForBrowseServer(): Promise<MentorSummary[]> {
  const data = await getJson<{ mentors: MentorSummary[] }>("/mentors");
  return data?.mentors ?? [];
}

/**
 * Fellow's auto-assigned mentor (sector match). Returns an envelope
 * shape so the page can show a clear "contact admin" empty state when
 * the lookup fails — fellows shouldn't pick mentors themselves.
 */
export type AssignedMentorResult =
  | { ok: true; mentor: MentorSummary }
  /**
   * `transient: true` = infrastructure failure (backend unreachable,
   * mid-deploy restart, 5xx) — the fellow may well HAVE a mentor and
   * should just retry. `transient: false` = the backend answered and
   * there genuinely is no mentor (no pin, no sector match) — retrying
   * won't change anything; an admin has to act. The page renders these
   * as two different states so an outage never reads as "you have no
   * mentor".
   */
  | { ok: false; message: string; transient: boolean };

export async function getMyAssignedMentorServer(): Promise<AssignedMentorResult> {
  try {
    const res = await backendFetch("/me/mentor", { method: "GET" });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return {
        ok: false,
        transient: res.status >= 500,
        message:
          body.message ??
          "We couldn't find a mentor assigned to you. Contact an admin.",
      };
    }
    const data = (await res.json()) as { mentor: MentorSummary };
    return { ok: true, mentor: data.mentor };
  } catch {
    return {
      ok: false,
      transient: true,
      message:
        "We couldn't reach the mentor service — this is usually a brief network blip.",
    };
  }
}

export async function listFellowBookingsServer(): Promise<FellowBooking[]> {
  const data = await getJson<{ bookings: FellowBooking[] }>("/me/bookings");
  return data?.bookings ?? [];
}

export async function listMentorBookingsServer(): Promise<MentorBooking[]> {
  const data = await getJson<{ bookings: MentorBooking[] }>("/me/mentor/bookings");
  return data?.bookings ?? [];
}

export async function listAdminBookingsServer(
  status?: "pending_mentor" | "pending_admin" | "confirmed" | "declined" | "cancelled" | "completed",
): Promise<AdminBooking[]> {
  const path = status
    ? `/admin/mentorship-bookings?status=${encodeURIComponent(status)}`
    : "/admin/mentorship-bookings";
  const data = await getJson<{ bookings: AdminBooking[] }>(path);
  return data?.bookings ?? [];
}
