import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Generic user profile (works for any role). Used by the
 *  /participants/:id page for non-fellow roles. */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/admin/users/${encodeURIComponent(id)}`);
}
