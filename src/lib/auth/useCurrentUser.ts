/**
 * Client-side current user.
 *
 * On mount, hits the local BFF (`/api/auth/me`) which forwards to the
 * backend. While that's in flight (and if it fails) the hook returns
 * `LOADING_USER` — a neutral placeholder with empty name/email and the
 * most-restrictive role. Consumers that need to gate UI on the
 * pre-hydration state can check `user.id === ""`.
 *
 * No mock-user fallback, no `dev_role` cookie. Real auth only.
 */
"use client";
import { useEffect, useState } from "react";
import { LOADING_USER, type CurrentUser, type Role } from "./users";

function backendToCurrentUser(u: {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  mustChangePassword?: boolean;
  codeOfConductAcceptedAt?: string | null;
  dataConsentAcceptedAt?: string | null;
}): CurrentUser {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    avatarUrl: u.avatarUrl ?? "/images/user/owner.jpg",
    mustChangePassword: u.mustChangePassword ?? false,
    codeOfConductAcceptedAt: u.codeOfConductAcceptedAt ?? null,
    dataConsentAcceptedAt: u.dataConsentAcceptedAt ?? null,
  };
}

export function useCurrentUser(): CurrentUser {
  const [user, setUser] = useState<CurrentUser>(LOADING_USER);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data: { user: ReturnType<typeof backendToCurrentUser> | null }) => {
        if (!cancelled && data?.user) {
          setUser(backendToCurrentUser(data.user));
        }
      })
      .catch(() => {
        // Backend offline / not signed in — leave LOADING_USER. Server
        // components that need auth will already have redirected to
        // /signin via getCurrentUser().
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return user;
}

export type { CurrentUser, Role } from "./users";
