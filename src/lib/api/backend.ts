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
import { cookies, headers } from "next/headers";

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
  const reqHeaders = new Headers(opts.headers);
  reqHeaders.set("Content-Type", "application/json");
  reqHeaders.set("Origin", PUBLIC_ORIGIN);

  // Forward the original client's IP so the backend's throttler keys
  // per-user (not per-Vercel-egress) and audit logs attribute the
  // right address. Without this, every signin request from across the
  // user base collapses onto Vercel's egress IP and trips the throttle
  // within seconds. `headers()` is the incoming request — only valid
  // inside a Next.js request handler, which is the only context that
  // calls backendFetch.
  try {
    const incoming = headers();
    const xff = incoming.get("x-forwarded-for");
    const realIp = incoming.get("x-real-ip");
    if (xff) reqHeaders.set("x-forwarded-for", xff);
    if (realIp) reqHeaders.set("x-real-ip", realIp);
  } catch {
    // Outside a request context (build, edge precompute). Skip silently.
  }

  if (opts.forwardAuth !== false) {
    const cookieStore = cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (token) reqHeaders.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...opts,
    headers: reqHeaders,
    cache: "no-store",
  });

  return res;
}
