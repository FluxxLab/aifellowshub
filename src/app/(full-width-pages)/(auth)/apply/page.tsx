import { redirect } from "next/navigation";

/**
 * `/apply` was the standalone registration page. The flow has moved
 * into `/signin#register` so users have a single auth surface — one
 * page with sign-in on top and "Register for the next cohort" below.
 *
 * Kept as a redirect (not deleted) so existing bookmarks, marketing
 * collateral, and indexed search results don't 404. Anchored at
 * `#register` so visitors land directly on the registration section
 * instead of having to scroll past the sign-in form.
 */
export default function ApplyPage() {
  redirect("/signin#register");
}
