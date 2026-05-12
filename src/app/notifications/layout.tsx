import PasswordChangeGate from "@/components/auth/PasswordChangeGate";
import LayoutShell from "@/layout/LayoutShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import React from "react";

/**
 * Multi-role notifications layout.
 *
 * `/notifications` is reachable by every signed-in user (BRD §6.11);
 * mirrors the `/forum` pattern (lifted out of role groups so all four
 * roles share the same surface).
 */
export default async function NotificationsLayout({
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
