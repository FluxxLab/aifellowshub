import type { CapstoneSector } from "./api/fellow-capstone";

/**
 * Canonical fellowship sector display labels. The backend stores lowercase
 * tokens (`healthcare`, `edtech`, `agriculture`,
 * `economic_inclusion_development`); older rows and adjacent areas (fintech,
 * governance, public policy) collapse into Economic Inclusion Development.
 *
 * This is the single source of truth for turning a stored sector value into
 * something we show a user. Import it everywhere a sector is displayed —
 * server mappers (capstone) and client views (profile header, lists) — so a
 * raw token like "edtech" can never leak into the UI again.
 */
export function normalizeSector(
  raw: string | null | undefined,
): CapstoneSector | null {
  if (!raw) return null;
  const norm = raw.trim().toLowerCase();
  if (norm.includes("health")) return "Healthcare";
  if (norm === "edtech" || norm.includes("educat")) return "Education";
  if (norm.includes("agric")) return "Agriculture";
  return "Economic Inclusion Development";
}

/** Display label with a sensible default for an unset/unknown sector. */
export function sectorLabel(raw: string | null | undefined): CapstoneSector {
  return normalizeSector(raw) ?? "Economic Inclusion Development";
}
