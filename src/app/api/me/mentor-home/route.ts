import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/**
 * GET /api/me/mentor-home — aggregate mentor home metrics. Returns
 * counts (fellows assigned, awaiting reply, submitted/under-review),
 * hours mentored this week, and a recent-activity feed across the
 * mentor's supervised capstones.
 */
export async function GET(req: NextRequest) {
 return proxy(req, "/me/mentor-home");
}
