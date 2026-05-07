import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/admin/fellows/${encodeURIComponent(id)}`);
}

/** Admin edit of a fellow's profile fields (BRD §6.2 Edit button). */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/admin/fellows/${encodeURIComponent(id)}`);
}
