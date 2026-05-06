import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import { CheckCircleIcon, FileIcon, TimeIcon } from "@/icons";
import { getMyAttempt } from "@/lib/api/fellow-assessment.server";
import type {
  FellowAttempt,
  FellowAttemptAnswer,
} from "@/lib/api/fellow-assessment";

export const metadata: Metadata = {
  title: "Your attempt · AI Fellows LMS",
};

/**
 * Fellow attempt-result page (BRD §6.5).
 *
 * Shows the fellow what they answered, what they scored, and any feedback
 * faculty left on manual answers. Multiple-choice shows a generic
 * "auto-graded" badge — the answer key is intentionally not exposed (the
 * backend strips it via `toFellowAttempt`).
 */
export default async function AttemptResultPage({
  params,
}: {
  params: { attemptId: string };
}) {
  const { attemptId } = params;
  const attempt = await getMyAttempt(attemptId);
  if (!attempt) return notFound();

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Learning", href: "/learning" },
          { label: "Your attempts", href: "/attempts" },
          { label: "Attempt" },
        ]}
      />
      <ResultHeader attempt={attempt} />
      <ol className="flex flex-col gap-4">
        {attempt.answers.map((a, idx) => (
          <AnswerCard key={a.id} answer={a} index={idx} />
        ))}
      </ol>
      {attempt.assessment?.module && (
        <footer className="flex justify-end">
          <Link
            href={`/learning/${attempt.assessment.module.weekNumber}`}
          >
            <Button variant="outline" size="sm">
              Back to Week {attempt.assessment.module.weekNumber}
            </Button>
          </Link>
        </footer>
      )}
    </div>
  );
}

function ResultHeader({ attempt }: { attempt: FellowAttempt }) {
  const passed = attempt.status === "passed";
  const failed = attempt.status === "failed";
  const pending = attempt.status === "pending_review";

  return (
    <header className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {passed && <Badge color="success" variant="light">Passed</Badge>}
            {failed && <Badge color="error" variant="light">Failed</Badge>}
            {pending && (
              <Badge color="info" variant="light">Awaiting review</Badge>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <TimeIcon className="h-3.5 w-3.5" />
              Submitted {new Date(attempt.submittedAt).toLocaleString()}
            </span>
          </div>
          <h1 className="mt-1 text-title-sm font-bold text-gray-800">
            {attempt.assessment?.title ?? "Assessment"}
          </h1>
          {attempt.assessment?.module && (
            <p className="mt-1 text-sm text-gray-500">
              Week {attempt.assessment.module.weekNumber} ·{" "}
              {attempt.assessment.module.title}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-gray-50 px-5 py-3 text-right">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            Your score
          </p>
          <p className="text-2xl font-bold text-fellowship-navy">
            {attempt.score !== null ? `${attempt.score}%` : "—"}
          </p>
          <p className="text-xs text-gray-500">
            Pass mark {attempt.assessment?.passingScore ?? 70}%
          </p>
        </div>
      </div>
      {pending && (
        <p className="mt-4 rounded-md bg-info-50 p-3 text-xs font-medium text-info-700">
          Faculty are still reviewing your written and uploaded answers. Your
          final score and feedback will appear here once they finish.
        </p>
      )}
    </header>
  );
}

function AnswerCard({
  answer,
  index,
}: {
  answer: FellowAttemptAnswer;
  index: number;
}) {
  const auto = answer.question.kind === "multiple_choice";
  const ungraded = answer.score === null;

  return (
    <li className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Question {index + 1}{" "}
          <span className="ml-2 font-normal text-gray-400">
            {kindLabel(answer.question.kind)}
          </span>
        </span>
        {ungraded ? (
          <Badge color="info" variant="light">Pending</Badge>
        ) : auto ? (
          <Badge
            color={answer.score === 1 ? "success" : "error"}
            variant="light"
          >
            {answer.score === 1 ? "Correct" : "Incorrect"}
          </Badge>
        ) : (
          <Badge
            color={
              answer.score === 1
                ? "success"
                : answer.score === 0
                ? "error"
                : "warning"
            }
            variant="light"
          >
            {Math.round((answer.score ?? 0) * 100)}%
          </Badge>
        )}
      </div>
      <p className="mt-2 text-sm font-medium text-gray-800 whitespace-pre-wrap">
        {answer.question.prompt}
      </p>

      <div className="mt-4">
        {answer.question.kind === "multiple_choice" && (
          <ul className="flex flex-col gap-2">
            {answer.question.choices.map((c) => {
              const picked = answer.choiceId === c.id;
              return (
                <li
                  key={c.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    picked
                      ? "border-fellowship-navy bg-fellowship-navy/5"
                      : "border-gray-200"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      picked
                        ? "border-fellowship-navy bg-fellowship-navy text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {picked && <CheckCircleIcon className="h-3 w-3" />}
                  </span>
                  <span className="flex-1 text-sm text-gray-800">{c.text}</span>
                  {picked && (
                    <span className="text-xs font-medium text-gray-500">
                      Your answer
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {(answer.question.kind === "short_text" ||
          answer.question.kind === "essay") && (
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap">
            {answer.text || (
              <span className="italic text-gray-400">No answer submitted.</span>
            )}
          </div>
        )}

        {answer.question.kind === "attachment" && (
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4 text-sm">
            <FileIcon className="h-5 w-5 text-gray-500" />
            <span className="text-gray-800">
              {answer.fileName ?? (
                <span className="italic text-gray-400">No file uploaded.</span>
              )}
            </span>
          </div>
        )}
      </div>

      {answer.feedback && (
        <div className="mt-4 rounded-xl border border-fellowship-navy/20 bg-fellowship-navy/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-fellowship-navy">
            Faculty feedback
          </p>
          <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">
            {answer.feedback}
          </p>
        </div>
      )}
    </li>
  );
}

function kindLabel(kind: FellowAttemptAnswer["question"]["kind"]): string {
  switch (kind) {
    case "multiple_choice":
      return "Multiple choice";
    case "short_text":
      return "Short answer";
    case "essay":
      return "Essay";
    case "attachment":
      return "File upload";
  }
}
