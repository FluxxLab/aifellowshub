import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/notifications/${encodeURIComponent(id)}/read`);
}
