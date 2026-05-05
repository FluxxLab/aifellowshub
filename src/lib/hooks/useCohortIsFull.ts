"use client";
import { useSearchParams } from "next/navigation";

/**
 * Phase-1 mock for cohort capacity state. Toggle via `?cohort=full`
 * on any page that consumes the hook (landing page, /signin, etc.).
 *
 * Phase 2: this gets replaced by a server-side fetch that reads the
 * configured cohort capacity vs the active fellow count from
 * `/settings`. The shape of this hook stays the same so consumers
 * don't need to change.
 *
 * Lives in its own file (rather than `ApplyForm.tsx`) so the
 * marketing page can use it without pulling Turnstile + the full
 * registration form into its bundle.
 */
export function useCohortIsFull(): boolean {
  const params = useSearchParams();
  return params.get("cohort") === "full";
}
