"use client";
import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon, ChevronLeftIcon } from "@/icons";
import type { Role } from "@/lib/auth/users";
import {
  pickNavForRole,
  pickNavForPath,
  type NavItem,
} from "./nav-items";

/**
 * Primary navigation chrome — structure adapted from the NextAdmin
 * Layouts/sidebar reference: items grouped by `section`, each section
 * is its own block separated by vertical space (no drawn dividers),
 * section labels visible only in expanded mode. Brand stays PIC navy
 * with the warning-400 yellow active tile.
 *
 * Width: 280px expanded, 64px collapsed (icon-only). Mobile: hidden by
 * default; opens as a left drawer with a backdrop when the top bar's
 * hamburger fires `mobileOpen=true`.
 *
 * State (collapsed/expanded, mobile-open) is owned by `LayoutShell`
 * because both this component and `AppTopNav` need to read it. We
 * receive it via props.
 */
export default function AppSidebar({
  userRole,
  collapsed,
  mobileOpen,
  onMobileClose,
  onToggleCollapse,
}: {
  userRole?: Role;
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const navItems = userRole
    ? pickNavForRole(userRole)
    : pickNavForPath(pathname);

  // Re-shape the flat NavItem[] into [{ label, items[] }] by walking
  // the array and starting a new section each time an item declares
  // a `section`. Memoised so we don't repartition on every render.
  const sections = useMemo(() => groupBySection(navItems), [navItems]);

  // Open/close state for sub-item groups. Auto-open the group whose
  // child matches the current path so deep-linking lands you with the
  // right group already expanded.
  const initiallyOpen = navItems.reduce<Record<string, boolean>>((acc, item) => {
    if (
      item.subItems?.some((s) => pathname === s.path || pathname.startsWith(`${s.path}/`))
    ) {
      acc[item.name] = true;
    }
    return acc;
  }, {});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initiallyOpen);

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // When the route changes, close the mobile drawer so the user sees
  // the page they navigated to.
  useEffect(() => {
    if (mobileOpen) onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isActive = (path: string) => pathname === path;
  const isParentActive = (item: NavItem) =>
    item.subItems?.some(
      (s) => pathname === s.path || pathname.startsWith(`${s.path}/`),
    ) ?? false;

  return (
    <>
      {/* Mobile backdrop — closes the drawer when tapped. */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onMobileClose}
          className="fixed inset-0 z-99998 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-99999 flex flex-col bg-fellowship-navy text-white transition-[width,transform] duration-200 ${
          collapsed ? "w-[64px]" : "w-[280px]"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        aria-label="Primary"
      >
        {/* Logo header — same height as the top nav (64px) so the two
            chrome surfaces line up at the seam. */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-white/10 ${
            collapsed ? "justify-center px-0" : "px-5"
          }`}
        >
          <Link
            href="/"
            aria-label="AI Fellows LMS — home"
            className={
              collapsed
                ? "inline-flex h-10 w-10 items-center justify-center rounded-md bg-white text-fellowship-navy text-sm font-extrabold tracking-tight shadow-theme-xs"
                : "inline-flex items-center"
            }
          >
            {collapsed ? (
              <span aria-hidden>PIC</span>
            ) : (
              <span className="flex items-center gap-4">
                <Image
                  src="/images/luminate.png"
                  alt="Luminate"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
                <Image
                  src="/images/logo.png"
                  alt="Africa Hub for Innovation & Development"
                  width={180}
                  height={56}
                  className="h-10 w-auto"
                  priority
                />
              </span>
            )}
          </Link>
        </div>

        {/* Nav — sections render as separate blocks with mb-6 spacing.
            Section labels only appear when the sidebar is expanded;
            collapsed mode relies purely on the empty-margin between
            sections to communicate grouping. */}
        <nav
          className="custom-scrollbar flex-1 overflow-y-auto py-4"
          aria-label="Primary navigation"
        >
          {sections.map((section, sIdx) => (
            <div
              key={section.label ?? `section-${sIdx}`}
              className="mb-6 last:mb-0"
            >
              {section.label && (
                <h2
                  className={`mb-2 px-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 transition-opacity duration-200 ${
                    collapsed ? "h-0 overflow-hidden opacity-0" : "opacity-100"
                  }`}
                >
                  {section.label}
                </h2>
              )}

              <ul className="flex flex-col gap-0.5 px-2">
                {section.items.map((item) =>
                  renderItem(item, {
                    collapsed,
                    pathname,
                    isActive,
                    isParentActive,
                    openGroups,
                    toggleGroup,
                  }),
                )}
              </ul>
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`hidden lg:flex shrink-0 items-center gap-2 border-t border-white/10 px-4 py-3 text-xs font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors ${
            collapsed ? "justify-center px-2" : ""
          }`}
        >
          <ChevronLeftIcon
            className={`h-4 w-4 transition-transform duration-200 ${
              collapsed ? "rotate-180" : ""
            }`}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

type Section = { label?: string; items: NavItem[] };

/** Walk the flat NavItem array and split into sections by `section`
 *  marker. Items before the first section marker fall into a
 *  label-less leading section so they still render. */
function groupBySection(items: NavItem[]): Section[] {
  const out: Section[] = [];
  let current: Section = { items: [] };
  for (const item of items) {
    if (item.section) {
      if (current.items.length > 0) out.push(current);
      current = { label: item.section, items: [item] };
    } else {
      current.items.push(item);
    }
  }
  if (current.items.length > 0) out.push(current);
  return out;
}

function renderItem(
  item: NavItem,
  ctx: {
    collapsed: boolean;
    pathname: string;
    isActive: (p: string) => boolean;
    isParentActive: (i: NavItem) => boolean;
    openGroups: Record<string, boolean>;
    toggleGroup: (name: string) => void;
  },
) {
  const { collapsed, isActive, isParentActive, openGroups, toggleGroup } = ctx;
  const active = item.path ? isActive(item.path) : isParentActive(item);

  if (!item.subItems) {
    return (
      <li key={item.name}>
        <Link
          href={item.path ?? "#"}
          aria-current={active ? "page" : undefined}
          title={collapsed ? item.name : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            active
              ? "bg-warning-400 text-fellowship-navy"
              : "text-white/80 hover:bg-white/5 hover:text-white"
          } ${collapsed ? "justify-center px-2" : ""}`}
        >
          <span className="h-5 w-5 shrink-0">{item.icon}</span>
          {!collapsed && <span className="truncate">{item.name}</span>}
        </Link>
      </li>
    );
  }

  const open = openGroups[item.name] ?? false;
  return (
    <li key={item.name}>
      <button
        type="button"
        onClick={() => toggleGroup(item.name)}
        aria-expanded={open}
        aria-current={active ? "page" : undefined}
        title={collapsed ? item.name : undefined}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          active
            ? "text-warning-400"
            : "text-white/80 hover:bg-white/5 hover:text-white"
        } ${collapsed ? "justify-center px-2" : ""}`}
      >
        <span className="h-5 w-5 shrink-0">{item.icon}</span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate text-left">{item.name}</span>
            <ChevronDownIcon
              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </>
        )}
      </button>

      {/* Children: inline when expanded; collapsed-mode flyouts are
          intentionally out of scope. Users can expand the sidebar
          to reach sub-items. */}
      {open && !collapsed && (
        <ul className="mt-0.5 ml-3 flex flex-col gap-0.5 border-l border-white/10 pl-3">
          {item.subItems.map((sub) => (
            <li key={sub.name}>
              <Link
                href={sub.path}
                aria-current={isActive(sub.path) ? "page" : undefined}
                className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${
                  isActive(sub.path)
                    ? "bg-warning-400 text-fellowship-navy font-semibold"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {sub.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
