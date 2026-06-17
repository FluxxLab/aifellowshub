import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

// The AI attendance report calls Claude on the backend, which can take
// 30-60s for a full cohort. Let the Vercel function run long enough, and
// give the upstream fetch a matching timeout so it isn't aborted at the
// default 12s ("This operation was aborted"). 60s is the function ceiling
// on most Vercel plans; the fetch timeout sits just under it.
export const maxDuration = 60;

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/sessions/${encodeURIComponent(id)}/attendance-report`, {
    timeoutMs: 55_000,
  });
}
