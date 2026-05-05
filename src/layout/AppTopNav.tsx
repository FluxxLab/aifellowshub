"use client";
import React from "react";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";

/**
 * Slim utility bar — sits above the main content area, to the right of
 * the sidebar. Holds notifications and the user dropdown.
 *
 * Primary navigation lives in `AppSidebar`. The `onSidebarToggle`
 * prop wires the hamburger button to the sidebar state owned by
 * `LayoutShell` — at the `lg` breakpoint and above this collapses the
 * sidebar to an icon rail; below it, the sidebar opens as an overlay
 * drawer. One button, viewport-aware behaviour.
 */
export default function AppTopNav({
  onSidebarToggle,
}: {
  onSidebarToggle: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
      {/* Padding mirrors the main content container in `LayoutShell`
          so the hamburger button vertically aligns with the page
          heading (and dashboard tiles) below — no awkward jog where
          the page content starts further-right than the top bar. */}
      <div className="flex h-[64px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Hamburger — toggles sidebar. On lg+ this collapses/expands the
            icon rail; below lg, opens/closes the overlay drawer. */}
        <button
          type="button"
          onClick={onSidebarToggle}
          aria-label="Toggle navigation"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
        >
          <HamburgerIcon />
        </button>

        {/* Right side — notifications + user dropdown */}
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <NotificationDropdown />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}

function HamburgerIcon() {
  return (
    <svg
      width="20"
      height="14"
      viewBox="0 0 20 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M1 1H19M1 7H19M1 13H19"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

