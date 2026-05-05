"use client";
import React, { useEffect, useRef } from "react";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";

/**
 * Top utility bar — sits above the main content area, to the right of
 * the sidebar. Three slots (filled-chip hamburger, search, right-side
 * controls) match the NextAdmin / TailAdmin reference rhythm: a tall
 * search field anchors the centre so the bar reads as balanced.
 *
 * Primary navigation lives in `AppSidebar`. The `onSidebarToggle`
 * prop wires the hamburger to the sidebar state owned by `LayoutShell`
 * — at the `lg` breakpoint and above this collapses the icon rail;
 * below it, opens/closes the overlay drawer. One button, viewport-
 * aware behaviour.
 *
 * The search input is intentionally a UI shell only — there's no
 * server-side search index yet (BRD §6 doesn't promise one). Pressing
 * Cmd/Ctrl+K focuses the field; submitting does nothing. When a real
 * search lands, swap the form's onSubmit and the input becomes wired.
 */
export default function AppTopNav({
  onSidebarToggle,
}: {
  onSidebarToggle: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+K focuses the search input — same shortcut every admin
  // dashboard ships with so muscle memory carries over.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Hamburger — filled-chip styling matches the reference's
            menu button: soft gray bg, rounded-xl, subtle shadow. Hover
            tints toward fellowship-navy for brand affordance. */}
        <button
          type="button"
          onClick={onSidebarToggle}
          aria-label="Toggle navigation"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600 shadow-theme-xs transition-all hover:bg-fellowship-navy/5 hover:text-fellowship-navy"
        >
          <HamburgerIcon />
        </button>

        {/* Search — anchors the centre. Hidden on small screens so the
            top bar doesn't crowd; on md+ it expands to fill the
            available space between the hamburger and the right-side
            controls. */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="hidden flex-1 md:block"
          role="search"
        >
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <SearchIcon />
            </span>
            <input
              ref={inputRef}
              type="search"
              placeholder="Search or type command..."
              aria-label="Search"
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pl-12 pr-14 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy/40 focus:bg-white focus:outline-none focus:ring-3 focus:ring-fellowship-navy/10"
            />
            <span
              aria-hidden
              className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-xs tracking-tight text-gray-500"
            >
              <span>⌘</span>
              <span>K</span>
            </span>
          </div>
        </form>

        {/* Right side — notifications + user dropdown */}
        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0 md:gap-3">
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

function SearchIcon() {
  return (
    <svg
      className="h-5 w-5 fill-current"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
      />
    </svg>
  );
}
