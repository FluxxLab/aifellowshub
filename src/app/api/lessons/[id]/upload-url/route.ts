/**
 * POST /api/lessons/:id/upload-url (frontend BFF)
 *
 * Forwards to the backend's lesson-content upload-signing endpoint.
 * The backend validates that the caller can edit this lesson
 * (admin / super_admin / faculty per the role decorators), checks
 * the requested MIME type + size against the allowlist, and returns
 * a presigned PUT URL for DigitalOcean Spaces.
 *
 * The signed URL is short-lived (5 min) and single-use; the browser
 * uploads bytes directly to Spaces with it. The backend never
 * touches the file content.
 */
import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxy(req, `/lessons/${encodeURIComponent(id)}/upload-url`);
}
