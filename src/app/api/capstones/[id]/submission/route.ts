import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Admin retracts a capstone submission — resets status to draft. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/capstones/${encodeURIComponent(id)}/submission`);
}
