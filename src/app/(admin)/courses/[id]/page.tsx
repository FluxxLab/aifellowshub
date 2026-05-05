import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseDetailHeader from "@/components/admin/courses/CourseDetailHeader";
import ModuleList from "@/components/admin/courses/ModuleList";
import { getCourseDetail } from "@/lib/api/courses.server";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourseDetail(id);
  return {
    title: course ? `${course.title} · Courses` : "Course · AI Fellows LMS",
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const course = await getCourseDetail(id);
  if (!course) notFound();

  const publishedCount = course.modules.filter((m) => m.isPublished).length;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <CourseDetailHeader course={course} publishedCount={publishedCount} />
      <ModuleList courseId={course.id} initialModules={course.modules} />
    </div>
  );
}
