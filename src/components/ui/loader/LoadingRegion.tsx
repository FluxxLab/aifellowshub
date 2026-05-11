import React from "react";

/**
 * Wrapper used by per-page `loading.tsx` files. Renders one
 * `role="status"` + sr-only label per page transition so AT users
 * get a single announcement, not one per shimmer block inside it.
 *
 * Visual shell matches the standard page container (`gap-4 md:gap-6`,
 * column flex). Pages that need a different layout (forum's chat
 * sidebar + panel split, AI Buddy's single-panel) can pass their own
 * `className` to override.
 */
export default function LoadingRegion({
  label = "Loading…",
  className = "flex flex-col gap-4 md:gap-6",
  children,
}: {
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
