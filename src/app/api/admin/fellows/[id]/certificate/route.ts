import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Admin: manually issue a certificate to a fellow. Body: `{ reason }`. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/admin/fellows/${encodeURIComponent(id)}/certificate`);
}
