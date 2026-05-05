import { redirect } from "next/navigation";
import PasswordChangeGate from "@/components/auth/PasswordChangeGate";
import LayoutShell from "@/layout/LayoutShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { roleHome } from "@/lib/auth/role-home";
import React from "react";

/**
 * Server-gated mentor layout. Admin + super_admin allowed in so they
 * can supervise mentor queues / capstone reviews. The backend's
 * `@Roles("mentor", "admin", "super_admin")` on capstone review
 * endpoints already permits this.
 */
export default async function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (
    user.role !== "mentor" &&
    user.role !== "admin" &&
    user.role !== "super_admin"
  ) {
    redirect(roleHome(user.role));
  }

  return (
    <LayoutShell userRole={user.role}>
      <PasswordChangeGate />
      {children}
    </LayoutShell>
  );
}
