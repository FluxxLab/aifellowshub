/**
 * Proxy a Next.js route-handler request straight through to the backend.
 *
 * Used by every BFF endpoint under `src/app/api/*` to keep them one-liners.
 * Forwards: the JWT cookie (as Bearer), method, query string, and JSON body.
 *
 * Error handling: when the backend responds, we pass the body and status
 * through unchanged — that way `BadGatewayException` (with a human-readable
 * Zoom error message, etc.) reaches the browser intact and the toast layer
 * can show it. When the backend can't be reached at all (network error,
 * BFF can't resolve `BACKEND_API_URL`), we synthesise a 502 response with
 * the underlying error message so the user sees "Couldn't reach backend at
 * <url>: ECONNREFUSED" instead of a silent generic 500.
 */
import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "./backend";

export async function proxy(
  req: NextRequest,
  backendPath: string,
): Promise<NextResponse> {
  const url = new URL(req.url);
  const fullPath = `${backendPath}${url.search}`;

  let body: string | undefined;
  if (req.method !== "GET" && req.method !== "DELETE") {
    body = await req.text();
  }

  let res: Response;
  try {
    res = await backendFetch(fullPath, {
      method: req.method,
      body,
    });
  } catch (err) {
    // Network-level failure (DNS, connection refused, timeout, etc.).
    // Surface the actual reason instead of letting the route handler
    // throw an unhandled exception that becomes an empty 500.
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        error: "backend_unreachable",
        message,
      },
      { status: 502 },
    );
  }

  if (res.status === 204) return new NextResponse(null, { status: 204 });

  // Read the body once. If it's JSON, pass it through; if not, wrap the
  // raw text in a structured error so the client sees something.
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      error: "invalid_backend_response",
      message:
        text.length > 0
          ? `Backend returned non-JSON ${res.status}: ${text.slice(0, 200)}`
          : `Backend returned ${res.status} with no body.`,
    };
  }

  return NextResponse.json(data, { status: res.status });
}
