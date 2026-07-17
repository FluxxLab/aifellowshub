import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/**
 * POST → fellow submits the end-of-programme (Week 9) survey.
 * GET  → check whether the current fellow has already submitted it.
 *
 * Asks the same questions as the pre-fellowship survey, but is stored
 * separately so the Week 1 baseline is preserved and the two can be compared.
 */
export async function POST(req: NextRequest) {
  return proxy(req, "/me/end-of-programme-survey");
}

export async function GET(req: NextRequest) {
  return proxy(req, "/me/end-of-programme-survey");
}
