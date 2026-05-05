"use client";

import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";

/**
 * Top utility bar — adapted from the NextAdmin reference. Hamburger
 * + page title cluster on the left, PIC's existing notification
 * dropdown + user info dropdown on the right. The reference's theme
 * toggle is intentionally omitted (the project is light-mode only).
 *
 * Page title is currently hard-coded to "Dashboard"; future work can
 * derive it from the route or a layout-level prop.
 */
export function Header() {
  const { toggleSidebar } = useSidebarContext();

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-md md:px-6 2xl:px-10">
      <div className="flex items-center gap-6">
        <button
          onClick={toggleSidebar}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-600 shadow-theme-xs transition-all hover:bg-fellowship-navy/5 hover:text-fellowship-navy"
        >
          <MenuIcon className="size-5" />
          <span className="sr-only">Toggle Sidebar</span>
        </button>
      </div>

      {/* Right cluster: notifications + user dropdown. PIC's existing
          components plug in unchanged. */}
      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        <NotificationDropdown />
        <UserDropdown />
      </div>
    </header>
  );
}
