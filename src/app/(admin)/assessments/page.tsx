import type { Metadata } from "next";
import AssessmentsView from "@/components/admin/assessments/AssessmentsView";
import { getAssessmentsServer } from "@/lib/api/assessments.server";

export const metadata: Metadata = {
  title: "Assessments · AI Fellows LMS",
  description:
    "Build assessments and grade short-answer responses (BRD §6.5). Passing an assessment is the alternative path to module completion.",
};

export default async function AssessmentsPage() {
  const assessments = await getAssessmentsServer();
  return <AssessmentsView assessments={assessments} />;
}
