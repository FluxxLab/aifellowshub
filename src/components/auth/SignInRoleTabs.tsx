"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Role-flavoured sign-in tabs — Fellow / Mentor / Faculty.
 *
 * **Important:** these tabs are UX framing, not authentication
 * boundaries. Login goes to the same `/api/auth/login` endpoint
 * regardless of tab; the user's role comes from the account record
 * the backend looks up, NOT from this client-side hint. So a fellow
 * who signs in via the "Mentor" tab still lands on the fellow home
 * (the role gate in `(fellow)/layout.tsx` handles it correctly).
 *
 * Why bother then: the tabs personalise the language ("welcome back,
 * mentor — pick up where you left off"), which makes the page feel
 * tailored even though the underlying flow is uniform.
 *
 * The active role is held in the URL as `?as=fellow|mentor|faculty`.
 * Read with `useSelectedSignInRole` in the form below.
 */

export type SignInRole = "fellow" | "mentor" | "faculty";

const TABS: { role: SignInRole; label: string }[] = [
  { role: "fellow", label: "Fellow" },
  { role: "mentor", label: "Mentor" },
  { role: "faculty", label: "Faculty" },
];

const DEFAULT_ROLE: SignInRole = "fellow";

export function useSelectedSignInRole(): SignInRole {
  const params = useSearchParams();
  const raw = params.get("as");
  if (raw === "mentor" || raw === "faculty" || raw === "fellow") return raw;
  return DEFAULT_ROLE;
}

export default function SignInRoleTabs() {
  const pathname = usePathname();
  const active = useSelectedSignInRole();
  return (
    <div
      role="tablist"
      aria-label="Sign in as"
      className="mb-6 inline-flex w-full max-w-md rounded-lg border border-gray-200 bg-gray-50 p-1"
    >
      {TABS.map((tab) => {
        const isActive = tab.role === active;
        return (
          <Link
            key={tab.role}
            // Same path, just a different `as` query param. Replacing
            // the URL keeps history clean — clicking through tabs
            // doesn't fill the back stack with /signin entries.
            href={`${pathname}?as=${tab.role}`}
            replace
            scroll={false}
            role="tab"
            aria-selected={isActive}
            className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors ${
              isActive
                ? "bg-white text-fellowship-navy shadow-theme-xs"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
