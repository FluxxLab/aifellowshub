import type { Metadata } from "next";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import { ChevronRightIcon, TimeIcon } from "@/icons";
import { getGradingQueue } from "@/lib/api/grading.server";
import FacultyGradingTour from "@/components/faculty/tours/FacultyGradingTour";

export const metadata: Metadata = {
  title: "Grading queue · AI Fellows LMS",
  description:
    "Fellow assessment attempts awaiting your manual review and grading.",
};

export default async function GradingQueuePage() {
  const attempts = await getGradingQueue();

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <FacultyGradingTour />
      <Breadcrumbs
        items={[
          { label: "Faculty home", href: "/faculty" },
          { label: "Grading queue" },
        ]}
      />

      <div>
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          Grading queue
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Attempts with written or uploaded answers waiting on your review.
          Multiple-choice scoring is already in — only the manual answers
          need a grade and feedback.
        </p>
      </div>

      {attempts === null ? (
        <section className="rounded-2xl border border-error-200 bg-error-50 p-6">
          <h2 className="text-base font-semibold text-error-700">
            Couldn&apos;t load the queue
          </h2>
          <p className="mt-1 text-sm text-error-600">
            The backend isn&apos;t reachable right now. Try again in a moment.
          </p>
        </section>
      ) : attempts.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-base font-semibold text-gray-800">
            Nothing in the queue
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            All caught up — written and uploaded answers will land here once
            fellows submit them.
          </p>
        </section>
      ) : (
        <ol className="flex flex-col gap-3">
          {attempts.map((a) => {
            const manualCount = a.answers.filter(
              (ans) =>
                ans.question.kind !== "multiple_choice" && ans.score === null,
            ).length;
            return (
              <li
                key={a.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-fellowship-navy md:p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge color="info" variant="light">
                        Pending review
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Submitted {relativeTime(a.submittedAt)}
                      </span>
                    </div>
                    <h2 className="mt-1 text-lg font-semibold text-gray-800">
                      {a.assessment?.title ?? "Assessment"}
                      {a.assessment?.module && (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          · Week {a.assessment.module.weekNumber} of{" "}
                          {a.assessment.module.course?.title ?? "—"}
                        </span>
                      )}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      <span className="font-medium text-gray-800">
                        {a.fellow?.fullName ?? "Unknown fellow"}
                      </span>
                      {a.fellow?.email && (
                        <span className="text-gray-500"> · {a.fellow.email}</span>
                      )}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-gray-600">
                      <TimeIcon className="h-4 w-4" />
                      {manualCount} answer{manualCount === 1 ? "" : "s"} need
                      grading
                    </div>
                  </div>

                  <div className="flex shrink-0 items-end">
                    <Link href={`/faculty/grading/${a.id}`}>
                      <Button size="sm" variant="fellowship">
                        Grade attempt
                        <ChevronRightIcon className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}
