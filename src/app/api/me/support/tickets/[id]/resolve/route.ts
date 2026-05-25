import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** PATCH /api/me/support/tickets/:id/resolve — fellow marks own ticket resolved. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/me/support/tickets/${encodeURIComponent(id)}/resolve`);
}
