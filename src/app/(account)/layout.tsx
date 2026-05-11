import { redirect } from "next/navigation";
import PasswordChangeGate from "@/components/auth/PasswordChangeGate";
import LayoutShell from "@/layout/LayoutShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import React from "react";

/**
 * Shared "your account" surfaces (profile, notification preferences,
 * password) — reachable from the UserDropdown for every non-fellow
 * role. Fellow has their own `/my-profile` under (fellow), so we
 * redirect fellows here to it for consistency with the dropdown.
 *
 * Lives in its own route group so the admin layout's role gate (which
 * only admits admin + super_admin) doesn't bounce mentors/faculty
 * before the page renders.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user.role === "fellow") {
    redirect("/my-profile");
  }

  return (
    <LayoutShell userRole={user.role}>
      <PasswordChangeGate />
      {children}
    </LayoutShell>
  );
}
