import { redirect } from "next/navigation";
import PasswordChangeGate from "@/components/auth/PasswordChangeGate";
import LayoutShell from "@/layout/LayoutShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { roleHome } from "@/lib/auth/role-home";
import React from "react";

/**
 * Server-gated faculty layout. Admin + super_admin allowed in: the
 * backend's `@Roles("admin", "super_admin", "faculty")` decorators on
 * module/lesson endpoints mean those roles use the same editor
 * surface. The `Edit module` action on the admin Course Detail page
 * routes here precisely for that reason.
 */
export default async function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (
    user.role !== "faculty" &&
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
