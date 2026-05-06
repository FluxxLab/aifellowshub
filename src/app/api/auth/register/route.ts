/**
 * POST /api/auth/register (frontend BFF)
 *
 * Same shape as login — proxies to the backend, stores the returned token
 * as an httpOnly cookie on this domain.
 */
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";

const SESSION_COOKIE = "pic_lms_session";
// Match the backend's JWT lifetime (`JWT_EXPIRES_IN`, default 1d) so
// the browser cookie expires when the token does — otherwise the
// cookie keeps being sent and the user sees silent 401s.
const ONE_DAY = 60 * 60 * 24;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "bad_request", message: "Body must be JSON." },
      { status: 400 },
    );
  }

  const res = await backendFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
    forwardAuth: false,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  const { user, accessToken } = data as {
    user: unknown;
    accessToken: string;
  };
  if (!accessToken) {
    return NextResponse.json(
      { error: "missing_token", message: "Backend did not return a token." },
      { status: 502 },
    );
  }

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ONE_DAY,
  });

  return NextResponse.json(
    { user },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
