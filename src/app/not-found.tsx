import GridShape from "@/components/common/GridShape";
import Image from "next/image";
import Link from "next/link";
import React from "react";

/**
 * App-wide 404. Hit when Next can't resolve a route — wrong URL,
 * stale bookmark, or an internal link pointing at a renamed page.
 *
 * Voice matches the rest of the LMS: direct, useful, no jokes.
 * Two next steps surface so the visitor doesn't dead-end — back to
 * the landing page (handles role-aware redirect for signed-in users)
 * or sign in (covers the "I got here from a stale email link" case).
 */
export default function NotFound() {
  return (
    <div className="relative z-1 flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      <GridShape />
      <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[520px]">
        <h1 className="mb-6 text-title-md font-bold text-gray-800 xl:text-title-2xl">
          Page not found
        </h1>

        <Image
          src="/images/error/404.svg"
          alt="404"
          width={472}
          height={152}
          priority
        />

        <p className="mt-10 text-base text-gray-700 sm:text-lg">
          The page you&rsquo;re looking for isn&rsquo;t here.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          The link may be out of date, the page may have been moved,
          or you may have followed a typo. If you reached this from
          inside the LMS, please let us know — we&rsquo;ll fix the link.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-fellowship-navy px-5 py-3 text-sm font-semibold text-white shadow-theme-xs transition-colors hover:bg-fellowship-navy-dark"
          >
            Back to home
          </Link>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 hover:text-gray-800"
          >
            Sign in
          </Link>
        </div>
      </div>

      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} · AI Ethics &amp; Governance
        Fellowship Programme · Africa Hub for Innovation &amp; Development
      </p>
    </div>
  );
}
