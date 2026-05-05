/**
 * Server-side current user.
 *
 * Hits the backend's `/auth/me` with the JWT cookie. Any failure
 * (missing cookie, expired token, network error) redirects to `/signin`
 * — there's no mock fallback. Public pages (e.g. certificate verify)
 * don't call this; only authenticated routes do.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { CurrentUser, Role } from "./users";

const SESSION_COOKIE = "pic_lms_session";

type BackendUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  hasSeenTour?: boolean;
  mustChangePassword?: boolean;
};

function backendToCurrentUser(u: BackendUser): CurrentUser {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    avatarUrl: u.avatarUrl ?? "/images/user/owner.jpg",
    hasSeenTour: u.hasSeenTour ?? true,
    mustChangePassword: u.mustChangePassword ?? false,
  };
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    redirect("/signin");
  }

  const backendUrl =
    process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!backendUrl) {
    // Misconfiguration — surface it loudly rather than silently mocking.
    throw new Error("BACKEND_API_URL is not set.");
  }

  // Pull the response in a try/catch so we can distinguish a transport
  // failure (DNS, connection refused, abort) from a non-2xx status. We do
  // *not* call `redirect()` inside the catch — `redirect()` works by
  // throwing a NEXT_REDIRECT error, and Next.js explicitly warns against
  // calling it inside try/catch (https://nextjs.org/docs/app/api-reference/functions/redirect).
  // Capture failure into a flag and redirect outside the try/catch.
  let res: Response | null = null;
  try {
    res = await fetch(`${backendUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch (err) {
    // Server-side log so the operator can see why auth fell through.
    // Only surface code + name + message — no URL, no request body, no
    // stack — to avoid leaking the JWT or internal hostnames into log
    // aggregators.
    const safe =
      err instanceof Error
        ? {
            name: err.name,
            message: err.message,
            code: (err as { code?: string }).code,
          }
        : { message: "unknown error" };
    console.error("[getCurrentUser] backend unreachable:", safe);
  }

  if (!res || !res.ok) {
    // Either a transport error (res is null) or a non-2xx status (most
    // likely 401 from an expired token). Either way, bounce to signin —
    // the signin POST will overwrite any stale cookie on success.
    redirect("/signin");
  }

  const { user } = (await res.json()) as { user: BackendUser };
  return backendToCurrentUser(user);
}

export type { CurrentUser, Role } from "./users";
