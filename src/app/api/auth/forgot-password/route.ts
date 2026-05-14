import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** POST /api/auth/forgot-password — start a password-reset flow.
 *  Body: { email }. Returns generic success regardless of whether the
 *  email matches a user (privacy). */
export async function POST(req: NextRequest) {
  return proxy(req, "/auth/forgot-password");
}
