"use client";
import React, { useState, useEffect } from "react";
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
 * Primary navigation chrome.
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
        {/* Logo — when expanded, render the dark-bg variant
            (`/images/logo.png`) directly on the navy: white-text
            transparent PNG sits cleanly without a white pill. When
            collapsed (64px rail), use the compact "PIC" monogram on
            a small white tile so it stays legible — same treatment
            as the favicon at app/icon.tsx. */}
        <div
          className={`flex h-[72px] shrink-0 items-center border-b border-white/10 ${
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
              <Image
                src="/images/logo.png"
                alt="Africa Hub for Innovation & Development"
                width={180}
                height={56}
                className="h-10 w-auto"
                priority
              />
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="flex flex-col gap-0.5 px-2">
            {navItems.map((item) => {
              const active = item.path
                ? isActive(item.path)
                : isParentActive(item);

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
                        <span className="flex-1 truncate text-left">
                          {item.name}
                        </span>
                        <ChevronDownIcon
                          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                            open ? "rotate-180" : ""
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {/* Children: inline when expanded; collapsed-mode flyouts
                      are intentionally out of scope for v1 — collapse +
                      sub-items is rare; users can expand the sidebar to
                      reach them. */}
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
            })}
          </ul>
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
