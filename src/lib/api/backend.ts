/**
 * Server-side fetch client for talking to the NestJS backend.
 *
 * Used inside Next.js route handlers (`src/app/api/*`). Reads the JWT from
 * the frontend's local cookie and forwards it to the backend as a
 * `Authorization: Bearer` header.
 *
 * Browsers never call this directly — they call the local route handlers,
 * which call this.
 */
import { cookies } from "next/headers";

// `BACKEND_API_URL` is the canonical name (server-side only). The legacy
// `NEXT_PUBLIC_API_URL` is honoured during the rollover so existing
// .env files keep working — drop the fallback once everyone's migrated.
const BACKEND_URL =
  process.env.BACKEND_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api";
const SESSION_COOKIE = "pic_lms_session";

// The backend's Origin-pinning CSRF middleware rejects state-changing
// requests with no Origin header. Server-side fetch() doesn't set one,
// so the BFF stamps the canonical public origin on every forwarded
// request. Safe because the BFF only runs on the server and is itself
// CSRF-protected at the route-handler layer.
const PUBLIC_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

type FetchOpts = RequestInit & {
  /** Forward the local session cookie as Authorization: Bearer. Default: true. */
  forwardAuth?: boolean;
};

export async function backendFetch(path: string, opts: FetchOpts = {}) {
  const headers = new Headers(opts.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Origin", PUBLIC_ORIGIN);

  if (opts.forwardAuth !== false) {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...opts,
    headers,
    cache: "no-store",
  });

  return res;
}
