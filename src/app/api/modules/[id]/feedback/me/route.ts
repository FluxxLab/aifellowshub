import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Fellow checks their own feedback submission for a module. */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/modules/${encodeURIComponent(id)}/feedback/me`);
}
