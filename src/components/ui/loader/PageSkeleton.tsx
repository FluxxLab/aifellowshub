import React from "react";
import Skeleton from "./Skeleton";

/**
 * Page-level loading shape used by every role's route-segment
 * `loading.tsx`. Mirrors the layout most LMS pages share — a heading
 * with a sentence under it, a 4-tile stats grid, and a wide content
 * card next to a narrow side card. Replacing the previous centred
 * spinner cuts perceived load time and avoids the layout shift you
 * get when a spinner gives way to a fully-populated dashboard.
 *
 * If a specific page wants a more accurate skeleton (e.g. the capstone
 * editor needs a draft-form shape), put a per-page `loading.tsx` next
 * to that route's `page.tsx`; Next picks the closest one.
 *
 * The wrapper announces a single `role="status"` so AT users get one
 * "Loading…" announcement per page transition, not one per shimmer.
 */
export interface PageSkeletonProps {
  /** What the page is loading. Defaults to "Loading…". */
  label?: string;
  /**
   * Tune the shape:
   *   - `dashboard` (default): hero + 4 stats + 2-up content
   *   - `list`: hero + filter row + stack of 6 list rows
   *   - `detail`: hero + 2-up grid (form-shaped)
   */
  variant?: "dashboard" | "list" | "detail";
}

const PageSkeleton: React.FC<PageSkeletonProps> = ({
  label = "Loading…",
  variant = "dashboard",
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-4 md:gap-6"
    >
      <span className="sr-only">{label}</span>

      {/* Page header — heading + sentence under it */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {variant === "dashboard" && <DashboardBody />}
      {variant === "list" && <ListBody />}
      {variant === "detail" && <DetailBody />}
    </div>
  );
};

export default PageSkeleton;

/* ---------- variants ---------- */

function DashboardBody() {
  return (
    <>
      {/* 4-tile stat row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatTileSkeleton key={i} />
        ))}
      </div>

      {/* 2-up content row: wide card + narrow side card */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
        <ContentCardSkeleton className="lg:col-span-2" rows={4} />
        <ContentCardSkeleton rows={2} />
      </div>

      {/* Wide footer card */}
      <ContentCardSkeleton rows={3} />
    </>
  );
}

function ListBody() {
  return (
    <>
      {/* Filter / search row */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* List rows */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </>
  );
}

function DetailBody() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
      <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
        <ContentCardSkeleton rows={6} />
        <ContentCardSkeleton rows={3} />
      </div>
      <div className="flex flex-col gap-4 md:gap-6">
        <ContentCardSkeleton rows={3} />
        <ContentCardSkeleton rows={2} />
      </div>
    </div>
  );
}

/* ---------- composable atoms ---------- */
/*
 * Exported so per-page `loading.tsx` files can compose page-shaped
 * skeletons without rebuilding the same shimmer-card-with-circle-and-
 * two-bars pattern. Keep these small + structural — anything more
 * bespoke (full sidebars, calendars, chat panels) is hand-rolled in
 * the per-page loading file.
 */

export function StatTileSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <Skeleton shape="circle" className="h-9 w-9" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-16" />
    </div>
  );
}

export function ContentCardSkeleton({
  rows,
  className = "",
}: {
  rows: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-5 md:p-6 ${className}`}
    >
      <Skeleton className="h-5 w-40 max-w-full" />
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}

/** Page heading + one-sentence subtitle. Mirrors the `<h1>…</h1><p>…</p>`
 *  pattern most pages open with. */
export function HeadingSkeleton({
  titleWidth = "w-72",
  subtitleWidth = "w-96",
}: {
  titleWidth?: string;
  subtitleWidth?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className={`h-9 ${titleWidth} max-w-full`} />
      <Skeleton className={`h-4 ${subtitleWidth} max-w-full`} />
    </div>
  );
}

/** A row in a list-style page (`learning` modules, `participants`, etc.). */
export function ListRowSkeleton({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-20 w-full ${className}`} />;
}

/** A row in a real table — avatar + two cells + trailing chip. */
export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0">
      <Skeleton shape="circle" className="h-9 w-9 shrink-0" />
      <div className="flex flex-1 flex-col gap-1">
        <Skeleton className="h-4 w-40 max-w-full" />
        <Skeleton className="h-3 w-56 max-w-full" />
      </div>
      <Skeleton className="hidden h-3 w-24 sm:block" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

/** Used for the dashboard's stat-tile row. Defaults to 4 tiles. */
export function StatTilesRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <StatTileSkeleton key={i} />
      ))}
    </div>
  );
}
