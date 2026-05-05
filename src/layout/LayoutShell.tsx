"use client";
import React, { useEffect, useState } from "react";
import AdminFooter from "./AdminFooter";
import AppSidebar from "./AppSidebar";
import AppTopNav from "./AppTopNav";
import type { Role } from "@/lib/auth/users";

/**
 * Composes sidebar + slim top bar + main content + footer for every
 * authenticated route. Owns the sidebar UI state (collapsed on
 * desktop, drawer on mobile) so that both `AppSidebar` and the
 * hamburger button in `AppTopNav` can read/write the same source of
 * truth.
 *
 * The `userRole` prop comes from the server-rendered route layout,
 * which already calls `getCurrentUser()` for its role gate. Passing
 * the role down here avoids an extra `/api/auth/me` round-trip and
 * eliminates the flash of wrong nav.
 *
 * Persistence: the desktop collapsed state is mirrored to
 * localStorage so the sidebar remembers the user's preference across
 * reloads. Mobile drawer state is per-session (it always starts
 * closed when the page loads).
 */
const COLLAPSED_STORAGE_KEY = "pic-lms-sidebar-collapsed";

export default function LayoutShell({
  userRole,
  children,
}: {
  userRole: Role;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hydrate from localStorage after mount to avoid SSR hydration
  // mismatch (the server can't read localStorage). The brief flash of
  // expanded-then-collapsed only happens on first ever load when the
  // user previously chose collapsed; subsequent loads are smooth
  // because the storage write happens synchronously below.
  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true") {
        setCollapsed(true);
      }
    } catch {
      // localStorage can throw in some private-mode browsers; the
      // sidebar just stays in its default state if so.
    }
  }, []);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        // ignore — see above
      }
      return next;
    });
  };

  /**
   * Single sidebar toggle — fires from the hamburger in the top bar
   * AND the "Collapse" button at the foot of the sidebar. Behaviour
   * depends on the current viewport: at lg+ we toggle the desktop
   * collapsed state (icon rail vs full-width); below lg we toggle
   * the mobile drawer.
   *
   * We read the breakpoint at click time via matchMedia rather than
   * tracking it in state to avoid resize listeners — the next click
   * always uses whatever width the viewport currently is.
   */
  const handleSidebarToggle = () => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches
    ) {
      toggleCollapse();
    } else {
      setMobileOpen((v) => !v);
    }
  };

  const sidebarWidthClass = collapsed ? "lg:ml-[64px]" : "lg:ml-[280px]";

  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar
        userRole={userRole}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onToggleCollapse={handleSidebarToggle}
      />

      <div className={`flex min-h-screen flex-col ${sidebarWidthClass}`}>
        <AppTopNav onSidebarToggle={handleSidebarToggle} />
        <main className="flex-1">
          {/* Horizontal padding scales with viewport: tight on phones,
              generous on desktop so content has clear breathing room
              from the sidebar edge. Matches the top bar's padding
              below so the hamburger and the page header align. */}
          <div className="mx-auto max-w-(--breakpoint-content) px-4 py-4 sm:px-6 md:py-6 lg:px-12 xl:px-16">
            {children}
          </div>
        </main>
        <AdminFooter />
      </div>
    </div>
  );
}
