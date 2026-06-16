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
  /** Per-attempt timeout in ms. Default 12s. */
  timeoutMs?: number;
  /**
   * Max attempts for idempotent (GET) requests. Default 3. Non-GET
   * requests are never retried — replaying a POST/PATCH/DELETE could
   * double-submit. Set to 1 to disable retries for a specific GET.
   */
  maxAttempts?: number;
};

/** Transient HTTP statuses worth a retry — server hiccups, cold starts,
 *  gateway blips, and throttling. 4xx (other than 429) are the caller's
 *  fault and won't change on replay, so we don't retry them. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

  // Only idempotent GETs are safe to replay. A failed POST/PATCH/DELETE
  // might have already mutated state on the backend, so we never retry it.
  const method = (opts.method ?? "GET").toUpperCase();
  const isIdempotent = method === "GET";
  const maxAttempts = isIdempotent ? Math.max(1, opts.maxAttempts ?? 3) : 1;
  const timeoutMs = opts.timeoutMs ?? 12_000;

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Per-attempt timeout so a hung backend (cold start, stuck socket)
    // doesn't stall the whole server render — abort and retry instead.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${BACKEND_URL}${path}`, {
        ...opts,
        headers: reqHeaders,
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timer);
      // Retry transient server statuses; return everything else (incl. 4xx).
      if (isIdempotent && isRetryableStatus(res.status) && attempt < maxAttempts) {
        await sleep(250 * attempt);
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      // Network error or abort (timeout). Retry idempotent requests with a
      // short linear backoff; otherwise propagate so the caller can handle it.
      if (isIdempotent && attempt < maxAttempts) {
        await sleep(250 * attempt);
        continue;
      }
      throw err;
    }
  }

  // Unreachable in practice — the loop either returns or throws — but keeps
  // the type checker happy and guards against a future logic change.
  throw lastErr ?? new Error(`backendFetch failed: ${path}`);
}
