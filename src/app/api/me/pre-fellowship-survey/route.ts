import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/**
 * POST → fellow submits the pre-fellowship diagnostic survey.
 * GET  → check whether the current fellow has already submitted.
 *
 * Both delegate to the backend; the component persists completion in
 * localStorage as well so the form stays collapsed between page loads
 * during the UI-first phase before the backend route lands.
 */
export async function POST(req: NextRequest) {
  return proxy(req, "/me/pre-fellowship-survey");
}

export async function GET(req: NextRequest) {
  return proxy(req, "/me/pre-fellowship-survey");
}
