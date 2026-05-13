import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** POST /api/support/tickets/:id/replies — requester or admin reply. */
export async function POST(
 req: NextRequest,
 { params }: { params: { id: string } },
) {
 const { id } = params;
 return proxy(req, `/support/tickets/${encodeURIComponent(id)}/replies`);
}
