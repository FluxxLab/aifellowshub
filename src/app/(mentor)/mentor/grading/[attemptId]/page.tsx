import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import GradingForm from "@/components/faculty/GradingForm";
import { getAttemptForGrader } from "@/lib/api/grading.server";

export const metadata: Metadata = {
  title: "Grade attempt · AI Fellows LMS",
};

/**
 * Mentor grades a single attempt. Reuses the shared `GradingForm`
 * component; only the surrounding crumbs + the post-submit
 * `returnTo` change vs the faculty version. Backend ownership rules
 * (the mentor can only grade attempts from their assigned fellows)
 * are enforced server-side in the grading endpoint.
 */
export default async function MentorGradeAttemptPage({
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
          { label: "Mentor home", href: "/mentor" },
          { label: "Grading queue", href: "/mentor/grading" },
          { label: attempt.fellow?.fullName ?? "Attempt" },
        ]}
      />
      <GradingForm attempt={attempt} returnTo="/mentor/grading" />
    </div>
  );
}
