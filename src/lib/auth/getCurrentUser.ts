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
  mustChangePassword?: boolean;
  codeOfConductAcceptedAt?: string | null;
  dataConsentAcceptedAt?: string | null;
};

function backendToCurrentUser(u: BackendUser): CurrentUser {
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

async function fetchMe(
  backendUrl: string,
  token: string,
): Promise<Response | null> {
  try {
    return await fetch(`${backendUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch (err) {
    // Log code + name + message only — no URL, no body, no stack —
    // so the JWT and internal hostnames don't leak into aggregators.
    const safe =
      err instanceof Error
        ? {
            name: err.name,
            message: err.message,
            code: (err as { code?: string }).code,
          }
        : { message: "unknown error" };
    console.error("[getCurrentUser] backend unreachable:", safe);
    return null;
  }
}

/**
 * Best-effort current user — returns null instead of redirecting when
 * the request is unauthenticated. For public pages that want to
 * personalise content if a session happens to be present (e.g. the
 * "sample" certificate verify view) without forcing a signin.
 */
export async function getOptionalCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const backendUrl =
    process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!backendUrl) return null;
  const res = await fetchMe(backendUrl, token);
  if (!res || !res.ok) return null;
  try {
    const { user } = (await res.json()) as { user: BackendUser };
    return backendToCurrentUser(user);
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const cookieStore = cookies();
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

  // Try once, then retry once on transient failures (network blip,
  // 5xx, gateway hiccup). Without the retry, any single hiccup during
  // a navigation refresh signs the user out mid-session — the bug
  // fellows experienced as "periodic sign-outs especially after
  // clicking Restart Tour" (which fires router.refresh()).
  //
  // 401 / 403 are NOT retried — they mean the token is genuinely
  // invalid (revoked, expired, tampered), and immediate signin
  // is the correct response.
  let res = await fetchMe(backendUrl, token);
  const isAuthFailure = res !== null && (res.status === 401 || res.status === 403);
  const isTransient = !res || (res.status >= 500 && res.status < 600);
  if (isTransient && !isAuthFailure) {
    await new Promise((r) => setTimeout(r, 250));
    res = await fetchMe(backendUrl, token);
  }

  if (!res || !res.ok) {
    redirect("/signin");
  }

  const { user } = (await res.json()) as { user: BackendUser };
  return backendToCurrentUser(user);
}

export type { CurrentUser, Role } from "./users";
