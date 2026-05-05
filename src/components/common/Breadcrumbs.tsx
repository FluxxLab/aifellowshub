import Link from "next/link";
import React from "react";

export type BreadcrumbItem = {
  label: string;
  /** Omit `href` for the current/active page — renders as plain text. */
  href?: string;
};

/**
 * Standalone breadcrumb trail. Use above page heroes that already render their
 * own h1 (fellow / mentor / faculty pages). For pages without a hero header,
 * use `PageBreadcrumb` instead — it includes the page title.
 */
export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {c.href && !isLast ? (
                <Link
                  href={c.href}
                  className="text-gray-500 transition-colors hover:text-gray-700"
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "font-medium text-gray-700" : "text-gray-500"}
                  aria-current={isLast ? "page" : undefined}
                >
                  {c.label}
                </span>
              )}
              {!isLast && (
                <svg
                  className="text-gray-300"
                  width="12"
                  height="12"
                  viewBox="0 0 17 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
