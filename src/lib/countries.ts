/**
 * Single source of truth for the country dropdown options used on the
 * consent wizard, onboarding wizard, fellow profile edit, and admin
 * "edit fellow" modal.
 *
 * Implementation: ISO 3166-1 alpha-2 codes from the `country-list`
 * package (249 territories), rendered via the platform's
 * `Intl.DisplayNames` API so we get clean modern names ("United Arab
 * Emirates", not "United Arab Emirates (the)") and locale-correct
 * spelling for free on browsers / Node 16+.
 *
 * Why not just `country-list.getNames()`: that package ships ISO-
 * standard names verbatim, which include awkward suffixes like
 * "(the)" on countries that take the definite article in the
 * registry. `Intl.DisplayNames` strips those.
 *
 * Sorted alphabetically by display name for predictable ordering in
 * the UI. Cached on first call — the underlying data and
 * `Intl.DisplayNames` are both stable so re-computing on every render
 * is wasteful.
 */
import { getCodes } from "country-list";

let cachedNames: string[] | null = null;

/** Sorted, English-localised list of every ISO 3166-1 country. */
export function getCountryNames(): string[] {
  if (cachedNames) return cachedNames;
  const codes = getCodes();
  const display = new Intl.DisplayNames(["en"], { type: "region" });
  const names = codes
    .map((c) => display.of(c))
    .filter((n): n is string => typeof n === "string" && n.length > 0)
    .sort((a, b) => a.localeCompare(b));
  cachedNames = names;
  return names;
}

/** True when `value` matches a real country name (case-sensitive).
 *  Used to migrate legacy free-text country entries: if it's already
 *  on the list, keep it; otherwise the caller falls back to "Other"
 *  or clears the field. */
export function isKnownCountry(value: string | null | undefined): boolean {
  if (!value) return false;
  return getCountryNames().includes(value);
}
