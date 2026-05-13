import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/**
 * POST /api/support/tickets — any authenticated user submits a
 * support question via the in-app Help widget. Forwards to the
 * backend's support module, which persists the ticket + pings
 * admin staff.
 */
export async function POST(req: NextRequest) {
 return proxy(req, "/support/tickets");
}
