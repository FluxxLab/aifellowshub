/**
 * POST /api/users/me/onboarding/complete (frontend BFF)
 *
 * Fired by `OnboardingChecklist.onFinish` after the fellow ticks all
 * required items. Backend runs forum membership hooks (auto-join
 * cohort + sector groups). Failure is non-fatal; the UI still
 * navigates to /home regardless of this call's result.
 */
import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function POST(req: NextRequest) {
  return proxy(req, "/users/me/onboarding/complete");
}
