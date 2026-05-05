/**
 * POST /api/auth/logout (frontend BFF)
 *
 * Forwards to the backend so the JWT is server-side invalidated (bumps
 * `tokenInvalidatedAt`), then clears the local httpOnly cookie. Either
 * step on its own is incomplete: the backend kill is what protects
 * against an exfiltrated token, the local clear is what makes the next
 * request unauthenticated. Idempotent.
 */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";

const SESSION_COOKIE = "pic_lms_session";

export async function POST() {
  // Best-effort backend invalidation. If the backend is unreachable we
  // still clear the cookie locally — better to log the user out of this
  // browser than fail closed and leave them signed in.
  await backendFetch("/auth/logout", { method: "POST" }).catch(() => null);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}
