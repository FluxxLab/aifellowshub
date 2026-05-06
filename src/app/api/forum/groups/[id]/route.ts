/**
 * /api/forum/groups/[id] (frontend BFF)
 *
 * PATCH — admin updates group metadata (name, description, isPrivate).
 * DELETE — admin removes a group. Default General group is protected
 *          server-side.
 */
import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxy(req, `/forum/groups/${encodeURIComponent(id)}`);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxy(req, `/forum/groups/${encodeURIComponent(id)}`);
}
