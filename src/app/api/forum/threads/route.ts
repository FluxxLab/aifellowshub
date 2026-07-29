import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/**
 * POST → fellow creates a forum thread (server enforces group membership).
 * GET  → list threads (kept for symmetry; the list is normally server-fetched).
 *
 * Without this proxy the client's POST to /api/forum/threads hit Next with no
 * handler and 404'd, so posting a thread failed.
 */
export async function POST(req: NextRequest) {
  return proxy(req, "/forum/threads");
}

export async function GET(req: NextRequest) {
  // proxy() forwards the query string itself, so pass the bare path.
  return proxy(req, "/forum/threads");
}
