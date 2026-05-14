import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/backend";

/** GET /api/admin/consents/export — proxies the backend's CSV with
 *  pass-through of Content-Type and Content-Disposition so the browser
 *  treats the response as a download. We can't use the generic proxy
 *  helper here because it JSON-parses the body; CSV must stay raw. */
export async function GET(req: NextRequest) {
  const res = await backendFetch("/admin/consents.csv", { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      {
        error: "backend_error",
        message: text || `Backend returned ${res.status}`,
      },
      { status: res.status },
    );
  }
  const body = await res.text();
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="ai-fellows-consents.csv"',
    },
  });
}
