/**
 * /api/forum/groups/[id]/members (frontend BFF)
 *
 * POST — admin adds a user to a group. Idempotent — re-adding is a
 * no-op so the UI doesn't have to dedupe before calling.
 */
import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/forum/groups/${encodeURIComponent(id)}/members`);
}
