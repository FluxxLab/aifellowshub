import type { Metadata } from "next";
import CoursesView from "@/components/admin/courses/CoursesView";
import { getCourses } from "@/lib/api/courses.server";

export const metadata: Metadata = {
  title: "Courses · AI Fellows LMS",
  description:
    "Manage courses and modules across the cohort (BRD §6.3). Faculty curates; admin oversees.",
};

export default async function CoursesPage() {
  const courses = await getCourses();
  return <CoursesView courses={courses} />;
}
