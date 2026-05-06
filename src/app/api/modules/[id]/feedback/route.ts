import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/**
 * POST → fellow submits end-of-module feedback.
 * GET  → admin/faculty/super_admin pulls aggregate ratings + anonymised comments.
 * Backend route guards enforce role; BFF just proxies.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/modules/${encodeURIComponent(id)}/feedback`);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/modules/${encodeURIComponent(id)}/feedback`);
}
