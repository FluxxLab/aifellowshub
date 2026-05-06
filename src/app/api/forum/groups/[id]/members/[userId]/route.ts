/**
 * /api/forum/groups/[id]/members/[userId] (frontend BFF)
 *
 * DELETE — admin removes a user from a group. Refused server-side for
 * the default General group.
 */
import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const { id, userId } = await params;
  return proxy(
    req,
    `/forum/groups/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`,
  );
}
