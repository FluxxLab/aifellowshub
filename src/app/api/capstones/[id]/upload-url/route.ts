import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Admin mints a presigned PUT URL to upload a document for a fellow. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/capstones/${encodeURIComponent(id)}/upload-url`);
}
