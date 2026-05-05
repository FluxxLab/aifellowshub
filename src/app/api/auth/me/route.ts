/**
 * GET /api/auth/me (frontend BFF) — proxies to backend with the JWT
 * forwarded as Authorization: Bearer.
 *
 * Returns 401 with a null user when not signed in (so callers can branch
 * cleanly without a try/catch).
 */
import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";

// `Cache-Control: no-store` is set on every response — `/auth/me`
// returns the current user, which must never be served from a CDN /
// browser cache (would risk leaking one user's profile to another).
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const res = await backendFetch("/auth/me", { method: "GET" });

  if (res.status === 401) {
    return NextResponse.json(
      { user: null },
      { status: 200, headers: NO_STORE },
    );
  }

  const data = await res.json().catch(() => ({ user: null }));
  return NextResponse.json(data, { status: res.status, headers: NO_STORE });
}
