import React from "react";
import Link from "next/link";

const APP_VERSION ="v0.1.0";

export default function AdminFooter() {
 return (
 <footer className="border-t border-gray-200 bg-white">
 <div className="mx-auto flex max-w-(--breakpoint-content) flex-col items-start justify-between gap-2 px-4 py-4 text-xs text-gray-500 sm:flex-row sm:items-center md:px-6">
 <p>
 © {new Date().getFullYear()} Policy Innovation Centre × AHFID. With
 support from Luminate.
 </p>
 <nav className="flex flex-wrap items-center gap-4">
 <Link
 href="/terms" className="hover:text-gray-700">
 Terms
 </Link>
 <Link
 href="/privacy" className="hover:text-gray-700">
 Privacy
 </Link>
 <Link
 href="/help" className="hover:text-gray-700">
 Help
 </Link>
 <span className="font-mono text-[11px] text-gray-400">
 {APP_VERSION}
 </span>
 </nav>
 </div>
 </footer>
 );
}
