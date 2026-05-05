import { redirect } from "next/navigation";
import PasswordChangeGate from "@/components/auth/PasswordChangeGate";
import LayoutShell from "@/layout/LayoutShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { roleHome } from "@/lib/auth/role-home";
import React from "react";

/**
 * Server component — runs `getCurrentUser()` (which itself redirects
 * unauthed users to /signin) and bounces wrong-role users to their
 * own role-home before any admin UI renders. `LayoutShell` then
 * renders sidebar + slim top bar + content for authenticated admins.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user.role !== "admin" && user.role !== "super_admin") {
    redirect(roleHome(user.role));
  }

  return (
    <LayoutShell userRole={user.role}>
      <PasswordChangeGate />
      {children}
    </LayoutShell>
  );
}
