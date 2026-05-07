import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Soft-delete: sets isActive=false on the user. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/admin/users/${encodeURIComponent(id)}/deactivate`);
}
