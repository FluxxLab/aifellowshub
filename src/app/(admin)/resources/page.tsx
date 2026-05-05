import type { Metadata } from "next";
import ResourcesView from "@/components/admin/resources/ResourcesView";
import { getResourcesServer } from "@/lib/api/resources.server";

export const metadata: Metadata = {
  title: "Resources · AI Fellows LMS",
  description:
    "Curate articles, PDFs, videos, tools, and datasets for fellows (BRD §6.9).",
};

export default async function ResourcesPage() {
  const resources = await getResourcesServer();
  return <ResourcesView resources={resources} />;
}
