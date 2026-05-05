/**
 * Proxy a Next.js route-handler request straight through to the backend.
 *
 * Used by every BFF endpoint under `src/app/api/*` to keep them one-liners.
 * Forwards: the JWT cookie (as Bearer), method, query string, and JSON body.
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

  const res = await backendFetch(fullPath, {
    method: req.method,
    body,
  });

  if (res.status === 204) return new NextResponse(null, { status: 204 });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
