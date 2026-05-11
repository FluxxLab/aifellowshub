import GridShape from "@/components/common/GridShape";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
  title: "Page not found · AI Fellows LMS",
  description:
    "The page you're looking for isn't here. Return to the AI Ethics & Governance Fellowship home, or sign in to continue.",
};

/**
 * Direct-URL 404 (e.g. `/error-404`). Same content as the App
 * Router's `not-found.tsx` so the framework's automatic 404 and a
 * manually-linked 404 page feel identical.
 */
export default function Error404() {
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
