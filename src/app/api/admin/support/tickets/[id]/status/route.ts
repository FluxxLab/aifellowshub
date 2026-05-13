import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** PATCH /api/admin/support/tickets/:id/status — admin opens/closes. */
export async function PATCH(
 req: NextRequest,
 { params }: { params: { id: string } },
) {
 const { id } = params;
 return proxy(req, `/admin/support/tickets/${encodeURIComponent(id)}/status`);
}
