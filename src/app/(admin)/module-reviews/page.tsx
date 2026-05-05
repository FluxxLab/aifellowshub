import type { Metadata } from "next";
import Link from "next/link";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { ChevronRightIcon } from "@/icons";
import { getFacultyReviewQueue } from "@/lib/api/faculty.server";
import type { FacultyReviewKind } from "@/lib/api/faculty";

export const metadata: Metadata = {
  title: "Module reviews · AI Fellows LMS",
  description:
    "Faculty submissions awaiting admin review — new modules and revisions to existing curriculum (BRD §6.3, §6.5).",
};

export default async function ModuleReviewsPage() {
  const queue = await getFacultyReviewQueue();
  const sorted = [...queue].sort(
    (a, b) => +new Date(a.submittedAt) - +new Date(b.submittedAt)
  );

  const newCount = queue.filter((q) => q.kind === "new").length;
  const revisionCount = queue.filter((q) => q.kind === "revision").length;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Programme" },
          { label: "Module reviews" },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          Module reviews
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Faculty submissions awaiting your approval. Older submissions appear
          first — clear them in order.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <Stat label="Awaiting review" value={String(queue.length)} intent={queue.length > 0 ? "warning" : "neutral"} />
        <Stat label="New modules" value={String(newCount)} />
        <Stat label="Revisions" value={String(revisionCount)} />
      </div>

      {queue.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">
            No submissions waiting on you. Faculty will appear here when they
            submit a new module or a revision.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3 md:gap-4">
          {sorted.map((q) => (
            <li
              key={q.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-fellowship-navy/30 md:p-6"
            >
              <Link
                href={`/module-reviews/${q.id}`}
                className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
              >
                <div className="flex flex-1 items-start gap-4 min-w-0">
                  <AvatarText
                    name={q.submittedBy.name}
                    className="h-10 w-10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Week {q.weekNumber}
                      </span>
                      <KindBadge kind={q.kind} />
                      <span className="text-xs text-gray-500">
                        · Submitted {relativeTime(q.submittedAt)}
                      </span>
                    </div>
                    <h2 className="mt-1 text-lg font-semibold text-gray-800">
                      {q.moduleTitle}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {q.moduleSummary}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Submitted by{" "}
                      <span className="font-medium text-gray-700">
                        {q.submittedBy.name}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 self-end text-sm font-medium text-fellowship-navy md:self-start md:pt-1">
                  Review
                  <ChevronRightIcon className="h-4 w-4" />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  intent = "neutral",
}: {
  label: string;
  value: string;
  intent?: "neutral" | "warning";
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-bold ${
          intent === "warning" ? "text-warning-700" : "text-gray-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function KindBadge({ kind }: { kind: FacultyReviewKind }) {
  return kind === "new" ? (
    <Badge color="success" variant="light">
      New module
    </Badge>
  ) : (
    <Badge color="info" variant="light">
      Revision
    </Badge>
  );
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;
  if (days < 30) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}
