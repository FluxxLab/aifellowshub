import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** GET /api/admin/support/tickets — admin's full ticket queue. */
export async function GET(req: NextRequest) {
 return proxy(req, "/admin/support/tickets");
}
