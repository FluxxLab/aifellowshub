import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** GET /api/me/support/tickets — current user's own support tickets. */
export async function GET(req: NextRequest) {
 return proxy(req, "/me/support/tickets");
}
