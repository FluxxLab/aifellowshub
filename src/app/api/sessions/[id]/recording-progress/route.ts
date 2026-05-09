import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Heartbeat fellow's recording-watch progress for half-credit attendance. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/sessions/${encodeURIComponent(id)}/recording-progress`);
}
