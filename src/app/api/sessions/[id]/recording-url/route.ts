import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Mint a short-lived signed URL for the session's recording. */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/sessions/${encodeURIComponent(id)}/recording-url`);
}
