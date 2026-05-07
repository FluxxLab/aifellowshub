import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Reverse of deactivate. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/admin/users/${encodeURIComponent(id)}/reactivate`);
}
