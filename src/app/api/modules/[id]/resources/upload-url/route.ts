/**
 * POST /api/modules/:id/resources/upload-url (frontend BFF)
 * Forwards to the backend's resource upload-signing endpoint.
 */
import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/modules/${encodeURIComponent(id)}/resources/upload-url`);
}
