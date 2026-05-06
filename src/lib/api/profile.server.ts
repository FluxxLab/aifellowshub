/**
 * Server-only profile fetch — uses `next/headers` for cookie forwarding,
 * which is forbidden in client bundles. Import this from server components
 * and route handlers only.
 */
import { getCurrentUser } from "../auth/getCurrentUser";
import { backendFetch } from "./backend";
import { backendToProfile, type BackendUser, type MyProfile } from "./profile";

/**
 * Returns the authenticated user's profile from the backend. When the
 * backend is unreachable, returns a minimal profile derived from the
 * mock-auth current-user (so signed-in pages still render their shell).
 */
export async function getMyProfile(): Promise<MyProfile> {
  try {
    const res = await backendFetch("/users/me", { method: "GET" });
    if (res.ok) {
      const data = (await res.json()) as { user: BackendUser };
      return backendToProfile(data.user);
    }
  } catch {
    // fall through
  }
  const user = await getCurrentUser();
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    country: "",
    organisation: "",
    jobTitle: "",
    sector: "Economic Inclusion Development",
    linkedinUrl: "",
    bio: "",
    notifications: {
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
    },
    joinedAt: new Date().toISOString(),
  };
}
