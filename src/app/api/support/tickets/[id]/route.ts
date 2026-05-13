import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** GET /api/support/tickets/:id — single ticket (requester or admin). */
export async function GET(
 req: NextRequest,
 { params }: { params: { id: string } },
) {
 const { id } = params;
 return proxy(req, `/support/tickets/${encodeURIComponent(id)}`);
}
