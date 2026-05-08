import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Reschedule a session — body: { startsAt, durationMinutes? }. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/sessions/${encodeURIComponent(id)}/reschedule`);
}
