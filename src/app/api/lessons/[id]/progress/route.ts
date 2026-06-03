import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Fellow heartbeats lesson video watch progress. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/lessons/${encodeURIComponent(id)}/progress`);
}
