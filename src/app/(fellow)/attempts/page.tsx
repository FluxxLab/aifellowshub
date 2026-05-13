import type { Metadata } from "next";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import { ChevronRightIcon, TimeIcon } from "@/icons";
import { getMyAttempts } from "@/lib/api/fellow-assessment.server";
import type { FellowAttempt } from "@/lib/api/fellow-assessment";

export const metadata: Metadata = {
  title: "Your attempts · AI Fellows LMS",
  description: "All assessment attempts you've submitted, most recent first.",
};

export default async function MyAttemptsPage() {
  const attempts = await getMyAttempts();

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Your attempts" },
        ]}
      />

      <div>
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          Your attempts
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Every assessment you&apos;ve submitted, most recent first. Click any
          attempt to see the breakdown and faculty feedback.
        </p>
      </div>

      {attempts === null ? (
        <ErrorCard />
      ) : attempts.length === 0 ? (
        <EmptyCard />
      ) : (
        <ol className="flex flex-col gap-3">
          {attempts.map((a) => (
            <AttemptRow key={a.id} attempt={a} />
          ))}
        </ol>
      )}
    </div>
  );
}

function AttemptRow({ attempt }: { attempt: FellowAttempt }) {
  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-fellowship-navy md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={attempt.status} />
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <TimeIcon className="h-3.5 w-3.5" />
              {new Date(attempt.submittedAt).toLocaleString(undefined, { timeZone: "Africa/Lagos" })}
            </span>
          </div>
          <h2 className="mt-1 text-lg font-semibold text-gray-800">
            {attempt.assessment?.title ?? "Assessment"}
          </h2>
          {attempt.assessment?.module && (
            <p className="mt-1 text-sm text-gray-500">
              Week {attempt.assessment.module.weekNumber} ·{" "}
              {attempt.assessment.module.title}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-end gap-3">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Score
            </p>
            <p className="text-lg font-bold text-fellowship-navy">
              {attempt.score !== null ? `${attempt.score}%` : "—"}
            </p>
          </div>
          <Link href={`/attempts/${encodeURIComponent(attempt.id)}`}>
            <Button size="sm" variant="outline">
              View
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: FellowAttempt["status"] }) {
  if (status === "passed") return <Badge color="success" variant="light">Passed</Badge>;
  if (status === "failed") return <Badge color="error" variant="light">Failed</Badge>;
  return <Badge color="info" variant="light">Awaiting review</Badge>;
}

function EmptyCard() {
  return (
    <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
      <h2 className="text-base font-semibold text-gray-800">
        No attempts yet
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Once you submit an assessment, your attempts will land here for review.
      </p>
      <div className="mt-4">
        <Link href="/learning">
          <Button size="sm" variant="fellowship">
            Open the curriculum
          </Button>
        </Link>
      </div>
    </section>
  );
}

function ErrorCard() {
  return (
    <section className="rounded-2xl border border-error-200 bg-error-50 p-6">
      <h2 className="text-base font-semibold text-error-700">
        Couldn&apos;t load your attempts
      </h2>
      <p className="mt-1 text-sm text-error-600">
        The backend isn&apos;t reachable right now. Try again in a moment.
      </p>
    </section>
  );
}
