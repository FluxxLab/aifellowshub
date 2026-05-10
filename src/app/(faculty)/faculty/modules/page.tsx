import type { Metadata } from "next";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import { ChevronRightIcon, PencilIcon, PlusIcon } from "@/icons";
import { getFacultyModules } from "@/lib/api/faculty.server";
import type { FacultyModuleStatus } from "@/lib/api/faculty";
import FacultyModulesTour from "@/components/faculty/tours/FacultyModulesTour";

export const metadata: Metadata = {
  title: "My modules · AI Fellows LMS",
  description:
    "All modules you author. Edit content, propose revisions, or submit a new module for admin review.",
};

export default async function FacultyModulesPage() {
  const modules = await getFacultyModules();
  const sorted = [...modules].sort((a, b) => {
    // In-progress (draft / under-review) first; then by week.
    const aActive = a.status !== "published";
    const bActive = b.status !== "published";
    if (aActive !== bActive) return aActive ? -1 : 1;
    return a.weekNumber - b.weekNumber;
  });

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <FacultyModulesTour />
      <Breadcrumbs
        items={[
          { label: "Faculty home", href: "/faculty" },
          { label: "My modules" },
        ]}
      />
      <div
        data-tour="faculty-modules-heading"
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
            My modules
          </h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Modules you author. Drafts and submissions appear at the top —
            published modules below.
          </p>
        </div>
        <span data-tour="faculty-modules-new">
          <Button size="md" variant="fellowship">
            <PlusIcon className="h-4 w-4" />
            Propose new module
          </Button>
        </span>
      </div>

      <ol
        data-tour="faculty-modules-list"
        className="flex flex-col gap-3 md:gap-4"
      >
        {sorted.map((m) => (
          <li
            key={m.id}
            className={`rounded-2xl border bg-white p-5 transition-colors md:p-6 ${
              m.status === "draft"
                ? "border-warning-200"
                : m.status === "under-review"
                ? "border-info-200"
                : "border-gray-200"
            }`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Week {m.weekNumber}
                  </span>
                  <StatusBadge status={m.status} />
                  <span className="text-xs text-gray-500">
                    · {m.lessonsCount} lessons · last edited{" "}
                    {relativeTime(m.lastEditedAt)}
                  </span>
                </div>
                <h2 className="mt-1 text-lg font-semibold text-gray-800">
                  {m.title}
                </h2>
                <p className="mt-1 text-sm text-gray-600">{m.summary}</p>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <Stat
                    label="Active fellows"
                    value={String(m.enrolledFellows)}
                  />
                  <Stat
                    label="Avg assessment"
                    value={
                      m.averageAssessmentScore !== null
                        ? `${m.averageAssessmentScore}%`
                        : "—"
                    }
                  />
                  <Stat
                    label="Lessons"
                    value={String(m.lessonsCount)}
                  />
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 md:items-end">
                <Link href={`/faculty/modules/${m.id}`}>
                  <Button size="sm" variant="fellowship">
                    <PencilIcon className="h-3.5 w-3.5" />
                    {m.status === "published" ? "View & edit" : "Open"}
                  </Button>
                </Link>
                <Link
                  href={`/faculty/modules/${m.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-fellowship-navy hover:text-fellowship-navy-dark"
                >
                  Lessons & assessment
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: FacultyModuleStatus }) {
  const map: Record<
    FacultyModuleStatus,
    { color: "success" | "warning" | "info"; label: string }
  > = {
    published: { color: "success", label: "Published" },
    draft: { color: "warning", label: "Draft" },
    "under-review": { color: "info", label: "Under review" },
  };
  const { color, label } = map[status];
  return (
    <Badge color={color} variant="light">
      {label}
    </Badge>
  );
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return `${Math.round(days / 30)} months ago`;
}
