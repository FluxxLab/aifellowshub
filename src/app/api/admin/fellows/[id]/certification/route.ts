import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Admin / faculty: fellow scorecard for staff review. */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/admin/fellows/${encodeURIComponent(id)}/certification`);
}
