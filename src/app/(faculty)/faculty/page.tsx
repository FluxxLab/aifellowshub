import type { Metadata } from "next";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { ChevronRightIcon, PencilIcon } from "@/icons";
import { getFacultyHome, getFacultyModules } from "@/lib/api/faculty.server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export const metadata: Metadata = {
  title: "Faculty home · AI Fellows LMS",
  description:
    "Your authored modules, drafts in flight, and how fellows are using your content (BRD §6.3, §6.5).",
};

export default async function FacultyHomePage() {
  const [user, home, modules] = await Promise.all([
    getCurrentUser(),
    getFacultyHome(),
    getFacultyModules(),
  ]);
  const firstName = user.fullName.split(" ").slice(-1)[0];
  const inFlight = modules.filter(
    (m) => m.status === "draft" || m.status === "under-review"
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          Hi, Dr. {firstName}.
        </h1>
        <p className="mt-2 text-gray-600">
          You own{" "}
          <Link
            href="/faculty/modules"
            className="font-semibold text-fellowship-navy underline-offset-2 hover:underline"
          >
            {home.modulesOwned} modules
          </Link>{" "}
          across the curriculum, with{" "}
          <span className="font-semibold text-gray-800">
            {home.activeFellows} active fellows
          </span>{" "}
          working through them right now.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        <StatCard label="Modules owned" value={String(home.modulesOwned)} />
        <StatCard
          label="Published"
          value={String(home.modulesPublished)}
          intent="success"
        />
        <StatCard
          label="In draft"
          value={String(home.modulesInDraft)}
          intent={home.modulesInDraft > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Awaiting admin review"
          value={String(home.modulesUnderReview)}
          intent={home.modulesUnderReview > 0 ? "info" : "neutral"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
        <section className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              Drafts & submissions in flight
            </h2>
            <Link
              href="/faculty/modules"
              className="inline-flex items-center gap-1 text-sm font-medium text-fellowship-navy hover:text-fellowship-navy-dark"
            >
              All modules
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {inFlight.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              No drafts in flight. Open one of your published modules to
              propose a revision.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {inFlight.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Week {m.weekNumber}
                      </span>
                      <StatusBadge status={m.status} />
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-gray-800">
                      {m.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">{m.summary}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Last edited {relativeTime(m.lastEditedAt)} ·{" "}
                      {m.lessonsCount} lessons
                    </p>
                  </div>
                  <Link href={`/faculty/modules/${m.id}`} className="shrink-0">
                    <Button size="sm" variant="outline">
                      <PencilIcon className="h-3.5 w-3.5" />
                      Open
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
          <h2 className="text-lg font-semibold text-gray-800">
            Recent activity
          </h2>
          <ul className="mt-4 space-y-4">
            {home.recentActivity.map((a) => (
              <li key={a.id} className="text-sm">
                <p className="text-gray-700">{a.message}</p>
                <p className="text-xs text-gray-500">{relativeTime(a.at)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  intent = "neutral",
}: {
  label: string;
  value: string;
  intent?: "neutral" | "success" | "warning" | "info";
}) {
  const colour =
    intent === "success"
      ? "text-success-700"
      : intent === "warning"
      ? "text-warning-700"
      : intent === "info"
      ? "text-info-700"
      : "text-gray-800";
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-2 text-3xl font-bold ${colour}`}>{value}</p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "published" | "draft" | "under-review";
}) {
  const map = {
    published: { color: "success" as const, label: "Published" },
    draft: { color: "warning" as const, label: "Draft" },
    "under-review": { color: "info" as const, label: "Under review" },
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
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return `${Math.round(days / 30)} months ago`;
}
