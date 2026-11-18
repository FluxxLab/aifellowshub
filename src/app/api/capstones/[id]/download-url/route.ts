import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Short-lived link to a capstone's uploaded document. */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/capstones/${encodeURIComponent(id)}/download-url`);
}
