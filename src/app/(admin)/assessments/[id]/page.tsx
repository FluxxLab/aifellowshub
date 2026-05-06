import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AssessmentDetailHeader from "@/components/admin/assessments/AssessmentDetailHeader";
import AssessmentDetailBody from "@/components/admin/assessments/AssessmentDetailBody";
import { getAssessmentServer } from "@/lib/api/assessments.server";

type PageProps = {
  params: { id: string };
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = params;
  const a = await getAssessmentServer(id);
  return {
    title: a ? `${a.title} · Assessments` : "Assessment · AI Fellows LMS",
  };
}

export default async function AssessmentDetailPage({ params }: PageProps) {
  const { id } = params;
  const assessment = await getAssessmentServer(id);
  if (!assessment) notFound();

  const pendingCount = assessment.submissions.filter(
    (s) => s.status === "pending-grading"
  ).length;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <AssessmentDetailHeader
        assessment={assessment}
        pendingCount={pendingCount}
      />
      <Suspense fallback={null}>
        <AssessmentDetailBody assessment={assessment} />
      </Suspense>
    </div>
  );
}
