/**
 * /api/forum/groups (frontend BFF)
 *
 * GET — list groups visible to the current user (membership +
 *       non-private). Powers the fellow channel rail and the admin
 *       management page.
 * POST — admin creates a new group.
 */
import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function GET(req: NextRequest) {
  return proxy(req, "/forum/groups");
}

export async function POST(req: NextRequest) {
  return proxy(req, "/forum/groups");
}
