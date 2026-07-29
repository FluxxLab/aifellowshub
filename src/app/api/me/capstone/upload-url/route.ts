import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/**
 * POST → mint a presigned PUT URL for a direct browser → DO Spaces upload of
 * a capstone document. Without this proxy route the client's request to
 * /api/me/capstone/upload-url hit Next with no handler and 404'd, so the PDF
 * attach never worked.
 */
export async function POST(req: NextRequest) {
  return proxy(req, "/me/capstone/upload-url");
}
