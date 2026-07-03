import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Unpin a fellow from a mentor — reverts them to sector auto-match. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; fellowId: string } },
) {
  const { id, fellowId } = params;
  return proxy(
    req,
    `/admin/mentors/${encodeURIComponent(id)}/fellows/${encodeURIComponent(fellowId)}`,
  );
}
