import GridShape from "@/components/common/GridShape";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative bg-white z-1 h-screen overflow-hidden">
      <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col">
        {children}
        <div className="lg:w-1/2 w-full h-full bg-fellowship-navy lg:grid items-center hidden">
          <div className="relative items-center justify-center flex z-1">
            {/* <!-- ===== Common Grid Shape Start ===== --> */}
            <GridShape />
            <div className="flex flex-col items-center max-w-md px-6 text-center">
              {/* Dark-bg logo variant (white text on transparent),
                  designed for the navy panel — no white pill needed. */}
              <Link
                href="/"
                className="mb-8 inline-flex items-center"
              >
                <Image
                  width={220}
                  height={64}
                  src="/images/logo.png"
                  alt="Africa Hub for Innovation & Development"
                  className="h-14 w-auto"
                />
              </Link>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-warning-400">
                AI Ethics &amp; Governance Fellowship
              </p>
              <h2 className="mb-4 text-2xl font-bold leading-tight text-white sm:text-3xl">
                Shaping the future of responsible AI in Africa.
              </h2>
              <p className="text-sm leading-relaxed text-white/70">
                A programme by the Policy Innovation Centre and Africa Hub for
                Innovation &amp; Development, with support from Luminate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
