import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** BFF proxy → `GET /admin/faculty` (lightweight roster used by the
 *  Schedule Session modal's teacher dropdown). */
export async function GET(req: NextRequest) {
  return proxy(req, "/admin/faculty");
}
