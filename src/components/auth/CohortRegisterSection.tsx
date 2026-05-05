"use client";
import {
  ApplicationForm,
  WaitlistForm,
  useCohortIsFull,
} from "@/components/auth/ApplyForm";

/**
 * The "Register for the next cohort" half of the auth page —
 * lives directly under the sign-in form on `/signin`.
 *
 * Two states:
 *   - cohort open  → render the full registration form
 *                    (delegates to `ApplicationForm`, which already
 *                    handles password policy, Turnstile, terms, etc.)
 *   - cohort full  → render the waitlist signup
 *                    (delegates to `WaitlistForm`)
 *
 * Both are imported from `ApplyForm.tsx` so we never duplicate the
 * field logic. Only the **outer framing** (heading, divider, anchor)
 * lives here.
 *
 * The hash anchor `#register` is honoured by browsers — landing-page
 * CTAs can deep-link to it (e.g. `/signin#register`) so users
 * scrolling from "Apply / Join" land directly on this section
 * instead of the sign-in form above.
 */
export default function CohortRegisterSection() {
  const cohortIsFull = useCohortIsFull();
  return (
    <section
      id="register"
      aria-labelledby="register-heading"
      className="mt-10 border-t border-gray-200 pt-8"
    >
      <h2
        id="register-heading"
        className="mb-1 text-base font-bold text-gray-800"
      >
        {cohortIsFull
          ? "Cohort 2026 is full"
          : "Register for the next cohort"}
      </h2>
      <p className="mb-6 text-sm text-gray-500">
        {cohortIsFull
          ? "Join the waitlist — we'll let you know when the next cohort opens."
          : "Don't have an account yet? Apply below to join the Fellowship."}
      </p>
      {cohortIsFull ? <WaitlistForm /> : <ApplicationForm />}
    </section>
  );
}
