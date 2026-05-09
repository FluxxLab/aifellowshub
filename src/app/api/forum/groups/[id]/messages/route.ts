import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** List messages in a forum group (chat view). */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/forum/groups/${encodeURIComponent(id)}/messages`);
}

/** Send a message into a forum group. Admins can post in any group. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/forum/groups/${encodeURIComponent(id)}/messages`);
}
