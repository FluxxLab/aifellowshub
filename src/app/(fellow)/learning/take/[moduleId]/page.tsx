import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import AssessmentTaker from "@/components/fellow/AssessmentTaker";
import { backendFetch } from "@/lib/api/backend";
import type {
  FellowAssessment,
  ModuleAttemptSummary,
} from "@/lib/api/fellow-assessment";
import { getModuleAttemptSummaryServer } from "@/lib/api/fellow-assessment.server";

/**
 * Fellow assessment-taking page (BRD §6.5).
 *
 * Server-fetches both the assessment and the fellow's attempt summary. If
 * the fellow can't start (already passed, awaiting review, or out of
 * attempts), renders a block message with a link to the relevant attempt
 * instead of the form. Otherwise hands the data to `<AssessmentTaker>`.
 */
export default async function TakeAssessmentPage({
  params,
}: {
  params: { moduleId: string };
}) {
  const { moduleId } = params;

  let assessment: FellowAssessment;
  let loadError: string | null = null;
  try {
    const res = await backendFetch(
      `/modules/${encodeURIComponent(moduleId)}/take`,
      { method: "GET" },
    );
    if (res.status === 404) return notFound();
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      loadError =
        data.message ?? `This assessment isn't available (status ${res.status}).`;
      assessment = {} as FellowAssessment;
    } else {
      const data = (await res.json()) as { assessment: FellowAssessment };
      assessment = data.assessment;
    }
  } catch (err) {
    loadError =
      err instanceof Error
        ? err.message
        : "Couldn't reach the server. Try again in a moment.";
    assessment = {} as FellowAssessment;
  }

  if (loadError) {
    return (
      <div className="flex flex-col gap-4 md:gap-6">
        <Breadcrumbs
          items={[
            { label: "Learning", href: "/learning" },
            { label: "Assessment" },
          ]}
        />
        <section className="rounded-2xl border border-error-200 bg-error-50 p-6">
          <h1 className="text-base font-semibold text-error-700">
            Couldn&apos;t load this assessment
          </h1>
          <p className="mt-1 text-sm text-error-600">{loadError}</p>
        </section>
      </div>
    );
  }

  const summary = await getModuleAttemptSummaryServer(moduleId);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Learning", href: "/learning" },
          { label: assessment.title },
        ]}
      />
      {summary && !summary.canStart ? (
        <BlockedCard summary={summary} title={assessment.title} />
      ) : (
        <>
          {summary && summary.attemptsUsed > 0 && (
            <AttemptsReminder summary={summary} />
          )}
          <AssessmentTaker assessment={assessment} />
        </>
      )}
    </div>
  );
}

function BlockedCard({
  summary,
  title,
}: {
  summary: ModuleAttemptSummary;
  title: string;
}) {
  const reason = summary.blockReason;
  const headline =
    reason === "passed"
      ? "You've already passed this assessment"
      : reason === "pending_review"
      ? "Your previous attempt is being reviewed"
      : reason === "no_attempts_left"
      ? "No attempts left"
      : "This assessment isn't available";

  const body =
    reason === "passed"
      ? `Best score: ${summary.bestScore ?? "—"}%. Once you've passed, the assessment is locked — focus on the next module.`
      : reason === "pending_review"
      ? "Faculty are still grading your written and uploaded answers. You'll be able to see your final score on the attempt page once they finish."
      : reason === "no_attempts_left"
      ? `You've used all ${summary.attemptsAllowed} attempt${summary.attemptsAllowed === 1 ? "" : "s"} for this assessment. If you need another shot, ask an admin or your faculty lead.`
      : "There's no assessment configured for this module yet.";

  const linkAttemptId = summary.bestAttemptId ?? summary.latestAttemptId;

  return (
    <section className="rounded-2xl border border-warning-200 bg-warning-50 p-6">
      <h1 className="text-base font-semibold text-fellowship-navy">
        {headline}
      </h1>
      <p className="mt-2 text-sm text-gray-700">{body}</p>
      <p className="mt-3 text-xs text-gray-500">
        {title} · attempts {summary.attemptsUsed} / {summary.attemptsAllowed}
      </p>
      {linkAttemptId && (
        <div className="mt-4">
          <Link href={`/attempts/${encodeURIComponent(linkAttemptId)}`}>
            <Button size="sm" variant="fellowship">
              View attempt
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
}

function AttemptsReminder({ summary }: { summary: ModuleAttemptSummary }) {
  const remaining = summary.attemptsAllowed - summary.attemptsUsed;
  return (
    <p className="rounded-md border border-warning-200 bg-warning-50 p-3 text-xs font-medium text-fellowship-navy">
      Retake — {remaining} attempt{remaining === 1 ? "" : "s"} left.
      {summary.bestScore !== null && (
        <> Best so far: {summary.bestScore}%.</>
      )}
    </p>
  );
}
