import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ModuleReviewView from "@/components/admin/module-reviews/ModuleReviewView";
import { getFacultyReviewItem } from "@/lib/api/faculty.server";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id } = params;
  const item = await getFacultyReviewItem(id);
  if (!item) return { title: "Review not found · AI Fellows LMS" };
  return {
    title: `Review · ${item.moduleTitle} · AI Fellows LMS`,
    description: `Review ${item.submittedBy.name}'s ${item.kind === "new" ? "new module" : "revision"} submission.`,
  };
}

export default async function ModuleReviewDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const item = await getFacultyReviewItem(id);
  if (!item) notFound();
  return <ModuleReviewView item={item} />;
}
