"use client";
import React from "react";

/**
 * Card presentation of a table row for phone widths. Pair with the desktop
 * table:
 *
 *   <div className="md:hidden">{rows.map(r => <MobileRowCard ...>)}</div>
 *   <div className="hidden md:block"><Table>…</Table></div>
 *
 * Sections:
 *   - `header`        — primary identity (avatar + name)
 *   - `meta`          — secondary line (org, email, sector chips)
 *   - `stats`         — labelled metric pairs (rendered as a 2-col grid)
 *   - `status`        — top-right badge
 *   - `actions`       — bottom-right action menu / link
 *
 * All sections are optional; a card with only a header still renders cleanly.
 */
type MobileRowCardProps = {
  header: React.ReactNode;
  meta?: React.ReactNode;
  status?: React.ReactNode;
  stats?: { label: string; value: React.ReactNode }[];
  actions?: React.ReactNode;
};

export default function MobileRowCard({
  header,
  meta,
  status,
  stats,
  actions,
}: MobileRowCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">{header}</div>
        {status && <div className="shrink-0">{status}</div>}
      </div>
      {meta && <div className="mt-2 text-sm text-gray-600">{meta}</div>}
      {stats && stats.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-gray-100 pt-3">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {s.label}
              </dt>
              <dd className="text-sm text-gray-800">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {actions && (
        <div className="mt-3 flex items-center justify-end border-t border-gray-100 pt-3">
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * Container for a stack of `MobileRowCard`s. Renders only on phone widths.
 * The matching desktop table should be wrapped in `hidden md:block`.
 */
export function MobileRowList({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2 md:hidden">{children}</div>;
}
