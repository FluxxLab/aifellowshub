/**
 * Mentorship booking — public types (BRD §6.10 extension).
 * Backend routes live under `/me/mentor/*`, `/mentors/*`, `/me/bookings`,
 * and `/admin/mentorship-bookings`.
 */

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "completed";

export type MentorSummary = {
  id: string;
  fullName: string;
  email: string;
  bio: string | null;
  sector: string | null;
  openSlotCount: number;
};

/** A single availability block published by a mentor. */
export type AvailabilitySlot = {
  id: string;
  mentorId: string;
  startsAt: string;
  durationMinutes: number;
  isBooked: boolean;
};

/** Mentor's own slot view — includes the booking when one exists. */
export type MentorSlot = AvailabilitySlot & {
  booking: {
    id: string;
    status: BookingStatus;
    topic: string | null;
    createdAt: string;
    fellow: { id: string; fullName: string } | null;
  } | null;
};

/** Common fields surfaced on every booking, regardless of viewer. */
type BookingBase = {
  id: string;
  status: BookingStatus;
  topic: string | null;
  slot: { id: string; startsAt: string; durationMinutes: number };
  approvedAt: string | null;
  declineReason: string | null;
  declinedAt: string | null;
  cancelledAt: string | null;
  zoomJoinUrl: string | null;
  zoomMeetingId: string | null;
  zoomMeetingPassword?: string | null;
  createdAt: string;
};

export type FellowBooking = BookingBase & {
  mentor: { id: string; fullName: string; email: string } | null;
};

export type MentorBooking = BookingBase & {
  fellow: { id: string; fullName: string; email: string } | null;
};

export type AdminBooking = BookingBase & {
  mentor: { id: string; fullName: string; email: string } | null;
  fellow: { id: string; fullName: string; email: string } | null;
  approvedBy: { id: string; fullName: string } | null;
};
