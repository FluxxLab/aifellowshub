import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** GET /api/admin/survey-responses — list all pre-fellowship survey responses. */
export async function GET(req: NextRequest) {
  return proxy(req, "/admin/survey-responses");
}
