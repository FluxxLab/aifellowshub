import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/**
 * POST /api/me/capstone/comment — fellow adds a message to the
 * capstone feedback thread. Forwards to the backend's
 * `/me/capstone/comment`, which appends a `CapstoneFeedback` row
 * (outcome `comments`, no status change) and pings the assigned
 * mentor.
 */
export async function POST(req: NextRequest) {
 return proxy(req, "/me/capstone/comment");
}
