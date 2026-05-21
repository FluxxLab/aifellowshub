import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Manually trigger a Zoom attendance reconciliation for a past session. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/sessions/${encodeURIComponent(id)}/reconcile-attendance`);
}
