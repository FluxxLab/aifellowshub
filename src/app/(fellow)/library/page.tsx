import type { Metadata } from "next";
import LibraryView from "@/components/fellow/LibraryView";
import { getLibraryServer } from "@/lib/api/fellow-library.server";

export const metadata: Metadata = {
  title: "Library · AI Fellows LMS",
  description:
    "Curated readings, audits, frameworks, and templates across the Fellowship curriculum (BRD §6.9).",
};

export default async function LibraryPage() {
  const resources = await getLibraryServer();
  return <LibraryView resources={resources} />;
}
