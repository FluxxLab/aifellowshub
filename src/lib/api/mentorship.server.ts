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

export async function listMentorsForBrowseServer(): Promise<MentorSummary[]> {
  const data = await getJson<{ mentors: MentorSummary[] }>("/mentors");
  return data?.mentors ?? [];
}

export async function getMentorServer(
  mentorId: string,
): Promise<MentorSummary | null> {
  const data = await getJson<{ mentor: MentorSummary }>(
    `/mentors/${encodeURIComponent(mentorId)}`,
  );
  return data?.mentor ?? null;
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
