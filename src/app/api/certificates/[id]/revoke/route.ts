import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Admin: revoke a certificate. Body: `{ reason }`. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/certificates/${encodeURIComponent(id)}/revoke`);
}
