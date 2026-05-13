import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function GET(req: NextRequest) {
  return proxy(req, "/me/mentor/bookings");
}

/**
 * POST /api/me/mentor/bookings — mentor-initiated coaching session
 * with one or more fellows. Forwards to the backend, which lands the
 * row(s) at pending_admin (admin approval creates the Zoom meeting).
 */
export async function POST(req: NextRequest) {
  return proxy(req, "/me/mentor/bookings");
}
