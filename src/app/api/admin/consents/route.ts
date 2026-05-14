import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** GET /api/admin/consents — list every fellow + their consent state. */
export async function GET(req: NextRequest) {
  return proxy(req, "/admin/consents");
}
