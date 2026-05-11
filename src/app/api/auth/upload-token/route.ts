/**
 * GET /api/auth/upload-token (frontend BFF)
 *
 * Returns the current user's JWT to the browser so it can perform a
 * cross-origin POST directly to the backend for large file uploads
 * (lesson content videos > Vercel's 4.5 MB body cap).
 *
 * Re-exposes the long-lived JWT to JS for the duration of an upload.
 * The cookie stays httpOnly for all other interactions — XSS could
 * already exfiltrate by abusing the BFF, so this brief surfacing
 * doesn't materially worsen the threat model.
 *
 * Caller contract: fetch this, get `{ token, backendOrigin }`, build
 * a FormData, POST to `${backendOrigin}/api/lessons/:id/upload-direct`
 * with `Authorization: Bearer ${token}`. Discard the token afterwards.
 */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "pic_lms_session";

export async function GET() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { error: "unauthenticated", message: "Sign in to upload." },
      { status: 401 },
    );
  }

  // The browser needs the backend's public origin (not the BFF path)
  // to hit the upload endpoint cross-origin. `NEXT_PUBLIC_BACKEND_URL`
  // is the canonical public-facing value; fall back to `BACKEND_API_URL`
  // (server-only) for dev environments where the two are the same host.
  const rawBackend =
    process.env.NEXT_PUBLIC_BACKEND_URL ??
    process.env.BACKEND_API_URL ??
    "http://localhost:4000/api";
  let backendOrigin: string;
  try {
    backendOrigin = new URL(rawBackend).origin;
  } catch {
    return NextResponse.json(
      { error: "misconfigured", message: "Backend URL not configured." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { token, backendOrigin },
    { headers: { "Cache-Control": "no-store" } },
  );
}
