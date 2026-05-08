import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Soft-cancel a session — sets status=cancelled, deletes Zoom meeting. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/sessions/${encodeURIComponent(id)}/cancel`);
}
