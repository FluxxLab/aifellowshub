/**
 * Browser- and server-side fetch helper that talks to the local BFF
 * (`/api/*` route handlers in this Next.js app). Use this — not raw `fetch`
 * — anywhere you call the backend so credentials, errors, and base URLs are
 * handled consistently.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export async function apiFetch<T>(
  path: string,
  opts: { method?: Method; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const url = path.startsWith("/api") ? path : `/api${path}`;
  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: opts.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: "include",
    signal: opts.signal,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data as { error?: string }).error ?? "request_failed",
      (data as { message?: string }).message ?? `Request failed with ${res.status}`,
      (data as { details?: unknown }).details,
    );
  }
  return data as T;
}
