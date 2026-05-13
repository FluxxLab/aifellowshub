"use client";
import React from "react";
import AdminFooter from "./AdminFooter";
import { Header } from "@/components/Layouts/header";
import { Sidebar } from "@/components/Layouts/sidebar";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import SupportWidget from "@/components/support/SupportWidget";
import type { Role } from "@/lib/auth/users";

/**
 * Composes sidebar + slim top bar + main content + footer for every
 * authenticated route, using the NextAdmin-style Layouts components.
 *
 * Layout shape (matches the upstream reference):
 *   <flex row>
 *     <Sidebar sticky top-0 h-screen />
 *     <flex column min-w-0 grow>
 *       <Header sticky top-0 />
 *       <main grows />
 *       <Footer />
 *     </flex column>
 *   </flex row>
 *
 * Sticky positioning only works when the sidebar lives in the flex
 * row alongside the content — pushing content via `margin-left` (an
 * earlier attempt) breaks the scrolling context the sticky header
 * needs.
 */
export default function LayoutShell({
  userRole,
  children,
}: {
  userRole: Role;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar userRole={userRole} />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="flex-1">
            {/* Horizontal padding scales with viewport: tight on
                phones, generous on desktop so content has clear
                breathing room from the sidebar edge. */}
            <div className="mx-auto max-w-(--breakpoint-content) px-4 py-4 sm:px-6 md:py-6 lg:px-12 xl:px-16">
              {children}
            </div>
          </main>
          <AdminFooter />
        </div>
        {/* In-app support widget — floats bottom-right on every
            authenticated surface. Opens a slide-over with a small
            ticket form (BRD §6.11 extension). */}
        <SupportWidget />
      </div>
    </SidebarProvider>
  );
}
