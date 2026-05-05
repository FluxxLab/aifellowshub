import { redirect } from "next/navigation";
import PasswordChangeGate from "@/components/auth/PasswordChangeGate";
import LayoutShell from "@/layout/LayoutShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { roleHome } from "@/lib/auth/role-home";
import React from "react";

/**
 * Server-gated fellow layout. Strict — admins/super_admins don't
 * shadow-view fellow URLs here. If the admin panel needs a fellow's
 * perspective, use dedicated /admin/fellows/[id] preview pages.
 */
export default async function FellowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user.role !== "fellow") {
    redirect(roleHome(user.role));
  }

  return (
    <LayoutShell userRole={user.role}>
      <PasswordChangeGate />
      {children}
    </LayoutShell>
  );
}
