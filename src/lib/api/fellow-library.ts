/**
 * Fellow library — public types (BRD §6.9). Reads run through
 * `fellow-library.server.ts` (`GET /me/resources`).
 */

export type ResourceKind = "pdf" | "link" | "video" | "dataset";

export type LibraryResource = {
  id: string;
  title: string;
  description: string;
  kind: ResourceKind;
  url: string;
  /**
   * Source metadata — null for cohort-wide featured reads, otherwise the week
   * the resource is tied to in the curriculum.
   */
  source:
    | {
        weekNumber: number;
        moduleTitle: string;
      }
    | null;
  /** Free-form topical tags used for filter chips. */
  tags: string[];
  /** Curated-by-faculty flag — surfaces in the Featured strip. */
  featured: boolean;
  /** Estimated reading or watch time, in minutes. */
  durationMinutes: number;
};

