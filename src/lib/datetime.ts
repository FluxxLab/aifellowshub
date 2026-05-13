/**
 * Date/time formatting helpers locked to the cohort's primary
 * timezone (Africa/Lagos, UTC+1, no DST). The fellowship is
 * Nigerian-run and every session, deadline, and notification is
 * scheduled in Lagos local time. Browser-default `toLocaleString`
 * picks up whatever timezone the user's device thinks it's in —
 * which on a server-side render is UTC — so dates can show up
 * an hour off, or wholly on the wrong day at midnight boundaries.
 *
 * Use these helpers everywhere a date/time renders for a fellow,
 * mentor, faculty member, or admin. They accept ISO strings or
 * Date objects.
 */
const COHORT_TZ = "Africa/Lagos";

type DateInput = Date | string | number;

function toDate(input: DateInput): Date {
 return input instanceof Date ? input : new Date(input);
}

/** "Wed, May 20" */
export function formatCohortDate(input: DateInput): string {
 return toDate(input).toLocaleDateString(undefined, {
 timeZone: COHORT_TZ,
 weekday: "short",
 day: "numeric",
 month: "short",
 });
}

/** "04:30 PM" */
export function formatCohortTime(input: DateInput): string {
 return toDate(input).toLocaleTimeString(undefined, {
 timeZone: COHORT_TZ,
 hour: "2-digit",
 minute: "2-digit",
 });
}

/** "Wed, May 20 · 04:30 PM" */
export function formatCohortDateTime(input: DateInput): string {
 return `${formatCohortDate(input)} · ${formatCohortTime(input)}`;
}

/** "20 May 2026" — long, prose use. */
export function formatCohortLongDate(input: DateInput): string {
 return toDate(input).toLocaleDateString(undefined, {
 timeZone: COHORT_TZ,
 day: "numeric",
 month: "long",
 year: "numeric",
 });
}

/** "May 20" — short, no weekday or year. */
export function formatCohortMonthDay(input: DateInput): string {
 return toDate(input).toLocaleDateString(undefined, {
 timeZone: COHORT_TZ,
 day: "numeric",
 month: "short",
 });
}

/** "May 20, 2026" — short date with year, no weekday. */
export function formatCohortShortDate(input: DateInput): string {
 return toDate(input).toLocaleDateString(undefined, {
 timeZone: COHORT_TZ,
 day: "numeric",
 month: "short",
 year: "numeric",
 });
}

/**
 * Full localised date + time, e.g. "May 20, 2026, 04:30 PM". Used
 * for verbose audit / verification timestamps. Always shows year
 * + time to disambiguate.
 */
export function formatCohortFull(input: DateInput): string {
 return toDate(input).toLocaleString(undefined, {
 timeZone: COHORT_TZ,
 day: "numeric",
 month: "short",
 year: "numeric",
 hour: "2-digit",
 minute: "2-digit",
 });
}
