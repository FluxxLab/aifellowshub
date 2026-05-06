import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/sessions/${encodeURIComponent(id)}/zoom-signature`);
}
