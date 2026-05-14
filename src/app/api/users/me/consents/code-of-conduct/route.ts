import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** POST /api/users/me/consents/code-of-conduct — fellow accepts the
 *  Code of Conduct. Body: { signatureName, country }. */
export async function POST(req: NextRequest) {
  return proxy(req, "/users/me/consents/code-of-conduct");
}
