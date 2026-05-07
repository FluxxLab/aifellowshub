import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/**
 * Fellow's auto-assigned mentor (sector match). Used by the
 * `/mentorship-sessions` page to render the request form pre-bound
 * to their mentor.
 */
export async function GET(req: NextRequest) {
  return proxy(req, "/me/mentor");
}
