import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/**
 * Admin/faculty ends a live session early. Backend calls Zoom to boot
 * everyone, stamps `endedAt`, and settles attendance proportionally.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/sessions/${encodeURIComponent(id)}/end`);
}
