import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** GET /api/admin/consents/:id — single fellow's full consent snapshot. */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/admin/consents/${encodeURIComponent(id)}`);
}
