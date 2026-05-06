/**
 * PATCH /api/lessons/:id/content (frontend BFF)
 *
 * Called by the lesson editor AFTER a successful upload to Spaces, to
 * attach the resulting public URL + metadata to the Lesson row.
 * Done as a separate endpoint (rather than reusing the general
 * PATCH /lessons/:id) so a partial upload — bytes uploaded but the
 * browser tab closed before this call — never leaves a half-attached
 * lesson row that the fellow viewer would render as broken.
 */
import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/lessons/${encodeURIComponent(id)}/content`);
}
