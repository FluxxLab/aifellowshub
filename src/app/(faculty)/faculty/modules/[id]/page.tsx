import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FacultyModuleEditor from "@/components/faculty/FacultyModuleEditor";
import { getFacultyModule } from "@/lib/api/faculty.server";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { id } = params;
  const m = await getFacultyModule(id);
  if (!m) return { title: "Module not found · AI Fellows LMS" };
  return {
    title: `Editing · ${m.title} · AI Fellows LMS`,
    description: m.summary,
  };
}

export default async function FacultyModuleEditPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const module_ = await getFacultyModule(id);
  if (!module_) notFound();
  return <FacultyModuleEditor initial={module_} />;
}
