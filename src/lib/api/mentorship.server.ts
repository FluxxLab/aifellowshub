/**
 * Server-side fetchers for the mentorship booking surface. All return
 * `null` (or empty list) when the backend is unreachable so pages can
 * render an empty state instead of crashing.
 */
import { backendFetch } from "./backend";
import type {
  AdminBooking,
  AvailabilitySlot,
  FellowBooking,
  MentorBooking,
  MentorSlot,
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

export async function getMentorAvailabilityServer(
  mentorId: string,
): Promise<{
  mentor: { id: string; fullName: string; email: string; bio: string | null; sector: string | null };
  slots: AvailabilitySlot[];
} | null> {
  return getJson(`/mentors/${encodeURIComponent(mentorId)}/availability`);
}

export async function listFellowBookingsServer(): Promise<FellowBooking[]> {
  const data = await getJson<{ bookings: FellowBooking[] }>("/me/bookings");
  return data?.bookings ?? [];
}

export async function listMentorSlotsServer(): Promise<MentorSlot[]> {
  const data = await getJson<{ slots: MentorSlot[] }>("/me/mentor/availability");
  return data?.slots ?? [];
}

export async function listMentorBookingsServer(): Promise<MentorBooking[]> {
  const data = await getJson<{ bookings: MentorBooking[] }>("/me/mentor/bookings");
  return data?.bookings ?? [];
}

export async function listAdminBookingsServer(
  status?: "pending" | "confirmed" | "declined" | "cancelled" | "completed",
): Promise<AdminBooking[]> {
  const path = status
    ? `/admin/mentorship-bookings?status=${encodeURIComponent(status)}`
    : "/admin/mentorship-bookings";
  const data = await getJson<{ bookings: AdminBooking[] }>(path);
  return data?.bookings ?? [];
}
