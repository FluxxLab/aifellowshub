import Badge from "@/components/ui/badge/Badge";
import { CheckLineIcon, CloseLineIcon } from "@/icons";
import type { CertificationScorecard } from "@/lib/api/fellow-certificates.server";

const TIER_COPY: Record<
  NonNullable<CertificationScorecard["tier"]>,
  { label: string; tone: "primary" | "success" | "warning" }
> = {
  certified: { label: "Certified", tone: "primary" },
  merit: { label: "With merit", tone: "success" },
  distinction: { label: "With distinction", tone: "warning" },
};

/**
 * Fellow's certification scorecard (BRD Fellowship Assessment table).
 * Renders the weighted breakdown — post-quizzes, attendance, lesson
 * quizzes, capstone — plus a list of remaining requirements when not
 * yet eligible. Once `eligible` is true, the certificate auto-issues
 * the next time their capstone-approved cascade runs.
 */
export default function CertificationScorecardCard({
  scorecard,
}: {
  scorecard: CertificationScorecard;
}) {
  const { totalScore, eligible, tier, missingRequirements, breakdown, criteria } =
    scorecard;
  const tierMeta = tier ? TIER_COPY[tier] : null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            Certification scorecard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Weighted across post-learning quizzes, class participation,
            assignments, and the capstone (BRD §6.6).
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Final score
          </p>
          <p className="text-3xl font-bold text-gray-800">
            {totalScore.toFixed(1)}%
          </p>
          {tierMeta ? (
            <Badge color={tierMeta.tone} variant="light">
              {tierMeta.label}
            </Badge>
          ) : (
            <Badge color="info" variant="light">
              In progress · need {criteria.passingThreshold}%
            </Badge>
          )}
        </div>
      </header>

      <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Tile
          label={`Post-learning quizzes · ${weightToPct(
            breakdown.postQuizzes.weight,
          )}%`}
          headline={`${breakdown.postQuizzes.averageScore.toFixed(1)}%`}
          detail={`${breakdown.postQuizzes.completed}/${breakdown.postQuizzes.required} completed · contributes ${breakdown.postQuizzes.contribution.toFixed(1)} pts`}
        />
        <Tile
          label={`Class participation · ${weightToPct(
            breakdown.participation.weight,
          )}%`}
          headline={`${breakdown.participation.attendanceRate.toFixed(0)}%`}
          detail={`${breakdown.participation.attendedSessions}/${breakdown.participation.requiredSessions} sessions · contributes ${breakdown.participation.contribution.toFixed(1)} pts`}
        />
        <Tile
          label={`Assignments · ${weightToPct(breakdown.assignments.weight)}%`}
          headline={`${breakdown.assignments.averageScore.toFixed(1)}%`}
          detail={`${breakdown.assignments.completed} graded · contributes ${breakdown.assignments.contribution.toFixed(1)} pts`}
        />
        <Tile
          label={`Capstone · ${weightToPct(breakdown.capstone.weight)}%`}
          headline={
            breakdown.capstone.status === "approved"
              ? "Approved"
              : breakdown.capstone.status === "in_progress"
                ? "In review"
                : "Not started"
          }
          detail={`Contributes ${breakdown.capstone.contribution.toFixed(1)} pts`}
        />
      </ul>

      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2">
          {eligible ? (
            <>
              <CheckLineIcon className="h-4 w-4 text-success-600" />
              <p className="text-sm font-semibold text-success-700">
                You&apos;re eligible — your certificate auto-issues when your
                capstone reaches final-approved.
              </p>
            </>
          ) : (
            <>
              <CloseLineIcon className="h-4 w-4 text-warning-600" />
              <p className="text-sm font-semibold text-gray-800">
                Not yet eligible
              </p>
            </>
          )}
        </div>
        {!eligible && missingRequirements.length > 0 && (
          <ul className="mt-3 space-y-1.5 text-sm text-gray-700">
            {missingRequirements.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-gray-400">·</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Tile({
  label,
  headline,
  detail,
}: {
  label: string;
  headline: string;
  detail: string;
}) {
  return (
    <li className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-800">{headline}</p>
      <p className="mt-1 text-xs text-gray-500">{detail}</p>
    </li>
  );
}

function weightToPct(w: number) {
  return Math.round(w * 100);
}
