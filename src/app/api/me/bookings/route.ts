import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function GET(req: NextRequest) {
  return proxy(req, "/me/bookings");
}

/**
 * Fellow proposes a mentorship session. Backend auto-resolves the
 * mentor from the fellow's sector — no mentorId in the URL.
 */
export async function POST(req: NextRequest) {
  return proxy(req, "/me/bookings");
}
