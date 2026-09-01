import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Admin records an uploaded document against a fellow's capstone. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/capstones/${encodeURIComponent(id)}/artifact`);
}
