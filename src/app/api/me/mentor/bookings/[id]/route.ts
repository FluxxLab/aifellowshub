import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/**
 * DELETE /api/me/mentor/bookings/:id — mentor removes a past booking
 * from their list. Backend enforces that only past sessions can be
 * deleted; upcoming sessions must be cancelled via the separate
 * cancel endpoint first.
 */
export async function DELETE(
 req: NextRequest,
 { params }: { params: { id: string } },
) {
 const { id } = params;
 return proxy(req, `/me/mentor/bookings/${encodeURIComponent(id)}`);
}
