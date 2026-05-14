import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** POST /api/auth/reset-password — complete a password reset with a
 *  single-use token from the emailed link. Body: { token, newPassword }. */
export async function POST(req: NextRequest) {
  return proxy(req, "/auth/reset-password");
}
