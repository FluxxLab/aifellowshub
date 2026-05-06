import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function GET(req: NextRequest) {
  // Forward the optional ?status= filter through to the backend.
  const search = req.nextUrl.search;
  return proxy(req, `/admin/mentorship-bookings${search}`);
}
