import PasswordChangeGate from "@/components/auth/PasswordChangeGate";
import LayoutShell from "@/layout/LayoutShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import React from "react";

/**
 * Multi-role forum layout.
 *
 * `/forum` is a shared route per BRD §6.8 — fellows post, mentors and
 * admins read + reply across all groups. Living under `(fellow)` got
 * non-fellows redirected to their role-home by the fellow layout's
 * strict gate, so admin / mentor / faculty couldn't reach the chat
 * even though `ForumChat` already renders the right view via its own
 * `isStaff` checks.
 *
 * No role gate here, just an auth gate. `getCurrentUser()` redirects
 * anonymous visitors to `/signin`, then `LayoutShell` mounts the
 * sidebar matching whichever role the viewer is.
 */
export default async function ForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <LayoutShell userRole={user.role}>
      <PasswordChangeGate />
      {children}
    </LayoutShell>
  );
}
