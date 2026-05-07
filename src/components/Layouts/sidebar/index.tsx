"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { roleHome } from "@/lib/auth/role-home";
import type { Role } from "@/lib/auth/users";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getNavData, getNavDataForPath } from "./data";
import { ArrowLeftIcon, ChevronUp } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";

export function Sidebar({ userRole }: { userRole?: Role }) {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  // Hover-to-peek: when the user-pinned `isOpen` state is collapsed, we
  // still expand the rail temporarily while the cursor is over it. Click
  // toggling keeps working — that updates `isOpen` (pin), and hover
  // never collapses a pinned-open sidebar. Mobile ignores hover (no
  // hover on touch + mobile uses an overlay drawer anyway).
  const [isHovered, setIsHovered] = useState(false);
  const visualOpen = isOpen || (!isMobile && isHovered);
  // Fellow nav uses tighter icons — they read as too heavy at the
  // default size-5 against the dense Programme dropdown. Other roles
  // keep size-5 since their nav is sparser.
  const iconSize = userRole === "fellow" ? "size-4" : "size-5";

  // Pick the role-aware nav once per render. Fall back to a path-
  // based guess when role hasn't hydrated yet so the rail doesn't
  // flash the wrong items between SSR and client mount.
  const navData = useMemo(
    () => (userRole ? getNavData(userRole) : getNavDataForPath(pathname)),
    [userRole, pathname],
  );

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));

    // Uncomment the following line to enable multiple expanded items
    // setExpandedItems((prev) =>
    //   prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    // );
  };

  useEffect(() => {
    // Keep collapsible open, when it's subpage is active
    navData.some((section) => {
      return section.items.some((item) => {
        return item.items.some((subItem) => {
          if (subItem.url === pathname) {
            if (!expandedItems.includes(item.title)) {
              toggleExpanded(item.title);
            }

            // Break the loop
            return true;
          }
        });
      });
    });
  }, [pathname, navData]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          // Brand: navy fellowship background instead of the
          // reference's light gray. White text/icons; the section
          // labels and dividers below flip to white/10–white/40 to
          // stay readable.
          "overflow-hidden bg-fellowship-navy text-white shadow-sm transition-[width] duration-300 ease-in-out",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
          isMobile
            ? (isOpen ? "w-[260px] translate-x-0" : "w-0 -translate-x-full")
            : (visualOpen ? "w-[250px]" : "w-[80px]"),
        )}
        aria-label="Main navigation"
        aria-hidden={!visualOpen}
        inert={!visualOpen}
      >
        <div className={cn(
          "flex h-full flex-col py-6 transition-all duration-300",
          visualOpen ? "px-5" : "px-2 items-center"
        )}>
          <div className="mb-8 flex items-center justify-center border-b border-white/10 pb-6">
            {/* Logo goes to the role-appropriate home (e.g.
                /dashboard for admin, /home for fellow), NOT `/` —
                the marketing page at `/` would log the user out
                visually by replacing the auth shell with public
                marketing chrome. */}
            <Link
              href={userRole ? roleHome(userRole) : "/"}
              onClick={() => isMobile && toggleSidebar()}
              className={cn(
                "flex items-center justify-center transition-all duration-300 w-full hover:opacity-80 rounded-xl py-2"
              )}
            >
              <div className="transition-all duration-300">
                <Logo />
              </div>
            </Link>

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
              >
                <span className="sr-only">Close Menu</span>

                <ArrowLeftIcon className="ml-auto size-7" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className="custom-scrollbar mt-4 flex-1 overflow-y-auto pr-3 min-[850px]:mt-6">
            {navData.map((section) => (
              <div key={section.label} className="mb-4">
                <h2 className={cn(
                  "mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white/40 transition-opacity duration-300",
                  visualOpen ? "opacity-100 px-3" : "opacity-0 h-0 overflow-hidden"
                )}>
                  {section.label}
                </h2>

                <nav role="navigation" aria-label={section.label}>
                  <ul className="space-y-0.5">
                    {section.items.map((item) => (
                      <li key={item.title}>
                        {item.items.length ? (
                          <div>
                            <MenuItem
                              isActive={item.items.some(
                                ({ url }) => url === pathname,
                              )}
                              onClick={() => toggleExpanded(item.title)}
                            >
                              <item.icon
                                className={cn("shrink-0", iconSize)}
                                aria-hidden="true"
                              />

                              {visualOpen && (
                                <>
                                  <span>{item.title}</span>

                                  <ChevronUp
                                    className={cn(
                                      "ml-auto size-4 rotate-180 transition-transform duration-200 opacity-50",
                                      expandedItems.includes(item.title) &&
                                      "rotate-0",
                                    )}
                                    aria-hidden="true"
                                  />
                                </>
                              )}
                            </MenuItem>

                            {expandedItems.includes(item.title) && (
                              <ul
                                className="ml-6 space-y-1.5 border-l border-white/10 py-1.5 pl-4"
                                role="menu"
                              >
                                {item.items.map((subItem) => (
                                  <li key={subItem.title} role="none">
                                    <MenuItem
                                      as="link"
                                      href={subItem.url}
                                      isActive={pathname === subItem.url}
                                    >
                                      {visualOpen && <span>{subItem.title}</span>}
                                    </MenuItem>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          (() => {
                            const href =
                              "url" in item
                                ? item.url + ""
                                : "/" +
                                item.title.toLowerCase().split(" ").join("-");

                            return (
                              <MenuItem
                                className="flex items-center gap-3 py-3"
                                as="link"
                                href={href}
                                isActive={pathname === href}
                              >
                                <item.icon
                                  className="size-5 shrink-0"
                                  aria-hidden="true"
                                />

                                {visualOpen && <span>{item.title}</span>}
                              </MenuItem>
                            );
                          })()
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
