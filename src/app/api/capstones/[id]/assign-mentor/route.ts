import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Admin assigns / reassigns the supervisor mentor on a capstone. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/capstones/${encodeURIComponent(id)}/assign-mentor`);
}
