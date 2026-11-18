import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Admin corrects a capstone's title. Body: `{ title }`. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/capstones/${encodeURIComponent(id)}/title`);
}
