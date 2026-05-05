import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import GradingForm from "@/components/faculty/GradingForm";
import { getAttemptForGrader } from "@/lib/api/grading.server";

export const metadata: Metadata = {
  title: "Grade attempt · AI Fellows LMS",
};

export default async function GradeAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const attempt = await getAttemptForGrader(attemptId);
  if (!attempt) return notFound();

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Faculty home", href: "/faculty" },
          { label: "Grading queue", href: "/faculty/grading" },
          { label: attempt.fellow?.fullName ?? "Attempt" },
        ]}
      />
      <GradingForm attempt={attempt} />
    </div>
  );
}
