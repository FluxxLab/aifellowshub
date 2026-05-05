"use client";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Renders nothing. Watches the current user; if `mustChangePassword` is
 * true and the user isn't already on `/change-password`, redirects them
 * with `?forced=1&next=<their-current-path>` so the form knows to skip
 * the back-link and to bounce them home after success.
 */
export default function PasswordChangeGate() {
  const user = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    if (!user.mustChangePassword) return;
    if (pathname?.startsWith("/change-password")) return;
    redirected.current = true;
    const next = encodeURIComponent(pathname || "/");
    router.replace(`/change-password?forced=1&next=${next}`);
  }, [user.mustChangePassword, pathname, router]);

  return null;
}
