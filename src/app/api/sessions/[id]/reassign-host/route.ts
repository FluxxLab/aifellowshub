import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Reassign a session to a different host — body: { hostId }. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/sessions/${encodeURIComponent(id)}/reassign-host`);
}
