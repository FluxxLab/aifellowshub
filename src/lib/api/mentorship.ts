/**
 * Mentorship coaching booking — public types (BRD §6.10 extension).
 *
 * 3-stage approval flow: fellow proposes a time → mentor accepts/declines
 * → admin approves (admin can't decline). No mentor-published slots.
 */

export type BookingStatus =
  | "pending_mentor"
  | "pending_admin"
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
};

/** Common fields surfaced on every booking, regardless of viewer. */
type BookingBase = {
  id: string;
  status: BookingStatus;
  topic: string | null;
  requestedStartsAt: string;
  requestedDurationMinutes: number;
  mentorRespondedAt: string | null;
  mentorDeclineReason: string | null;
  approvedAt: string | null;
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
