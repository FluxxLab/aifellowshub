import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** List the fellows under a mentor's care + fellows available to pin. */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/admin/mentors/${encodeURIComponent(id)}/fellows`);
}

/** Pin a set of fellows to a mentor. Body: `{ fellowIds: string[] }`. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/admin/mentors/${encodeURIComponent(id)}/fellows`);
}
