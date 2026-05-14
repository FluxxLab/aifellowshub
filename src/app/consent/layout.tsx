import Image from "next/image";
import Link from "next/link";
import React from "react";

/**
 * Layout for the consent wizard — minimal chrome, no sidebar, no
 * notifications bell. Fellows must complete both consents before the
 * (fellow) layout will load the dashboard, so the page intentionally
 * has nothing to navigate away to except sign-out.
 */
export default function ConsentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="Africa Hub for Innovation & Development"
              width={140}
              height={40}
              className="h-8 w-auto"
              priority
            />
            <span className="hidden text-xs font-semibold uppercase tracking-wide text-gray-500 sm:inline">
              Fellowship onboarding
            </span>
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-12 border-t border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-3xl px-4 text-center text-xs text-gray-500 md:px-6">
          You must agree to both documents before the dashboard opens. Need
          help? Email{" "}
          <a
            href="mailto:liaison@aiegfellowship.org"
            className="font-medium text-fellowship-navy underline"
          >
            liaison@aiegfellowship.org
          </a>
          .
        </div>
      </footer>
    </div>
  );
}
