/**
 * PATCH /api/lessons/:id/content — attach uploaded content to a lesson.
 * DELETE /api/lessons/:id/content — clear it again (faculty hit trash).
 *
 * PATCH was originally called after a presigned-PUT upload to Spaces;
 * the backend-proxied upload now does attach inline, but the PATCH
 * shape is kept for tooling that still uses the two-step flow.
 * DELETE is the right shape for detach (nulls failed validation
 * against the AttachLessonContentDto allowlist).
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/lessons/${encodeURIComponent(id)}/content`);
}
