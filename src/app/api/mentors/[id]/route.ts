import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Single mentor profile — used by the fellow request form. */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/mentors/${encodeURIComponent(id)}`);
}
