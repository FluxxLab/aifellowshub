import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/**
 * Pin a mentor to a fellow (admin override). Body: `{ mentorId: string }`
 * to set, `{ mentorId: null }` to clear and revert to sector match.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/admin/fellows/${encodeURIComponent(id)}/mentor`);
}
