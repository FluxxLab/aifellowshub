import React from "react";

const APP_VERSION = "v0.1.0";

/**
 * Bottom-of-page footer for the admin / fellow / mentor / faculty
 * shell. Previously linked to `/terms`, `/privacy`, and `/help` — but
 * none of those routes existed, so every page load triggered three
 * 404 RSC prefetches as soon as Next.js eagerly fetched the footer's
 * `<Link>`s. Pulled until the pages are built; the in-app support
 * widget covers "Help" in the meantime and the consent documents
 * themselves contain the privacy + terms text fellows agreed to.
 */
export default function AdminFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-(--breakpoint-content) flex-col items-start justify-between gap-2 px-4 py-4 text-xs text-gray-500 sm:flex-row sm:items-center md:px-6">
        <p>
          © {new Date().getFullYear()} Policy Innovation Centre × AHFID. With
          support from Luminate.
        </p>
        <span className="font-mono text-[11px] text-gray-400">
          {APP_VERSION}
        </span>
      </div>
    </footer>
  );
}
