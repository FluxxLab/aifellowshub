"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "./client";

/**
 * Shared client hook for any admin list backed by the new server-side
 * pagination contract. Mirrors the backend's `Paged<T>` envelope so
 * the same hook drives every paginated table.
 *
 * Features:
 *   - `page` + `pageSize` state managed internally; caller sets via
 *     `setPage`. Default page = 1, default pageSize = 25.
 *   - Arbitrary extra query params via the `params` option, with
 *     stable JSON serialisation so a referentially-changing options
 *     object doesn't refetch in a loop (caller passes fresh objects
 *     freely).
 *   - Search debounce baked in: pass `params.q` and consecutive
 *     keystrokes coalesce into a single fetch 250ms after the user
 *     stops typing.
 *   - Page auto-resets to 1 whenever params change. Avoids the
 *     "I'm on page 4 and just typed a search and got an empty list"
 *     dead-state.
 *   - Robust against rapid re-fetches: each fetch carries a generation
 *     number; stale responses are dropped before they overwrite a
 *     newer page's data.
 *
 * Returns an opinionated set of state + actions tables can wire up
 * with zero extra plumbing — `rows`, `total`, `page`, `pageCount`,
 * `setPage`, `isLoading`, `error`, `refresh`.
 */

export type Paged<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

type UsePagedQueryOptions = {
  /** Extra query-string parameters merged into every request. Keys
   *  whose value is undefined / null / "" are omitted. */
  params?: Record<string, string | number | boolean | null | undefined>;
  pageSize?: number;
  /** Debounce window in ms for params changes (0 = immediate). */
  debounceMs?: number;
};

export function usePagedQuery<T>(
  basePath: string,
  options: UsePagedQueryOptions = {},
) {
  const { params, pageSize = 25, debounceMs = 250 } = options;

  // Stable serialised key for the extra params. Wrapping in a string
  // means a new options object with the same values doesn't trigger
  // a refetch — saves us from a lot of useMemo at every call site.
  const paramsKey = stableStringify(params ?? {});

  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<T> | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Bump on every fetch. Late responses with a stale `gen` are
  // dropped so the table never shows yesterday's slice on today's
  // page.
  const genRef = useRef(0);

  // Reset to page 1 whenever params change so a filter switch never
  // strands the user on an out-of-range page. Skips on the very
  // first render — that's already page 1.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setPage(1);
  }, [paramsKey]);

  const doFetch = useCallback(
    async (gen: number) => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        qs.set("page", String(page));
        qs.set("pageSize", String(pageSize));
        const parsed = JSON.parse(paramsKey) as Record<string, unknown>;
        for (const [key, value] of Object.entries(parsed)) {
          if (value === undefined || value === null || value === "") continue;
          qs.set(key, String(value));
        }
        const response = await apiFetch<Paged<T>>(
          `${basePath}?${qs.toString()}`,
          { method: "GET" },
        );
        if (gen === genRef.current) {
          setData(response);
          setLoading(false);
        }
      } catch (err) {
        if (gen === genRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      }
    },
    [basePath, page, pageSize, paramsKey],
  );

  // Debounced effect: when params change, wait `debounceMs` before
  // firing. Page changes are immediate (no debounce on Next/Prev
  // clicks).
  useEffect(() => {
    const gen = ++genRef.current;
    if (debounceMs === 0) {
      void doFetch(gen);
      return;
    }
    const t = setTimeout(() => void doFetch(gen), debounceMs);
    return () => clearTimeout(t);
    // Refetch only when the actual fetch contract changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath, page, pageSize, paramsKey]);

  const refresh = useCallback(() => {
    const gen = ++genRef.current;
    void doFetch(gen);
  }, [doFetch]);

  return {
    rows: data?.rows ?? [],
    total: data?.total ?? 0,
    page,
    pageSize: data?.pageSize ?? pageSize,
    pageCount: data?.pageCount ?? 1,
    setPage,
    isLoading,
    error,
    refresh,
  };
}

/** Deterministic JSON.stringify so two objects with the same keys+values
 *  but different key insertion orders serialise identically. Important
 *  because callers often build the `params` object inline, which means
 *  property order isn't guaranteed across renders. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys
    .map(
      (k) =>
        `${JSON.stringify(k)}:${stableStringify(
          (value as Record<string, unknown>)[k],
        )}`,
    )
    .join(",")}}`;
}
