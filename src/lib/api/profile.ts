/**
 * "My profile" — types + the client-safe `updateMyProfile` mutation.
 *
 * Server-side `getMyProfile` lives in `profile.server.ts` because it depends
 * on `next/headers` (cookie forwarding). Client components must NOT import
 * the server file.
 */
import type { Role } from "../auth/useCurrentUser";
import type { Sector } from "./participants";
import { apiFetch } from "./client";

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  emailEnabled: true,
  pushEnabled: true,
  inAppEnabled: true,
  events: {
    sessionReminders: true,
    assignmentsDue: true,
    modulesUnlocked: true,
    certificateIssued: true,
    forumReplies: true,
    capstoneReviews: true,
  },
};

export type NotificationEventToggles = {
  sessionReminders: boolean;
  assignmentsDue: boolean;
  modulesUnlocked: boolean;
  certificateIssued: boolean;
  forumReplies: boolean;
  capstoneReviews: boolean;
};

export type NotificationPreferences = {
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  events: NotificationEventToggles;
};

export type MyProfile = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  country: string;
  organisation: string;
  jobTitle: string;
  sector: Sector;
  linkedinUrl: string;
  bio: string;
  notifications: NotificationPreferences;
  joinedAt: string;
};

/** SECTOR enum mapping — backend stores snake_case, frontend uses Title Case. */
export function sectorFromBackend(s: string | null | undefined): Sector {
  switch (s) {
    case "healthcare":
      return "Healthcare";
    case "edtech":
      return "Education";
    case "agriculture":
      return "Agriculture";
    case "economic_inclusion_development":
    default:
      return "Economic Inclusion Development";
  }
}

function sectorToBackend(s: Sector): string {
  switch (s) {
    case "Healthcare":
      return "healthcare";
    case "Education":
      return "edtech";
    case "Agriculture":
      return "agriculture";
    case "Economic Inclusion Development":
    default:
      return "economic_inclusion_development";
  }
}

export type BackendUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  country: string | null;
  organisation: string | null;
  jobTitle: string | null;
  sector: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  joinedAt: string;
};

export function backendToProfile(u: BackendUser): MyProfile {
  // Notification preferences aren't on the user table yet — default to
  // everything-on so the toggles render with sensible values until the
  // backend grows them.
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    country: u.country ?? "",
    organisation: u.organisation ?? "",
    jobTitle: u.jobTitle ?? "",
    sector: sectorFromBackend(u.sector),
    bio: u.bio ?? "",
    linkedinUrl: u.linkedinUrl ?? "",
    notifications: DEFAULT_NOTIFICATION_PREFS,
    joinedAt: u.joinedAt,
  };
}

/**
 * Client-side update — called by ProfileView's "Save" buttons. Posts to the
 * BFF; the BFF forwards to the backend with the user's JWT.
 */
export type ProfileUpdate = Partial<{
  fullName: string;
  country: string | null;
  organisation: string | null;
  jobTitle: string | null;
  sector: Sector;
  bio: string | null;
  linkedinUrl: string | null;
}>;

export async function updateMyProfile(patch: ProfileUpdate): Promise<MyProfile> {
  const body: Record<string, unknown> = { ...patch };
  if (patch.sector !== undefined) {
    body.sector = sectorToBackend(patch.sector);
  }
  const data = await apiFetch<{ user: BackendUser }>("/users/me", {
    method: "PATCH",
    body,
  });
  return backendToProfile(data.user);
}
