import type { Metadata } from "next";
import Link from "next/link";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import { ChevronRightIcon } from "@/icons";
import { getMentorQueueServer } from "@/lib/api/mentor-capstone.server";
import type { CapstoneStatus } from "@/lib/api/fellow-capstone";
import MentorQueueTour from "@/components/mentor/tours/MentorQueueTour";

export const metadata: Metadata = {
  title: "Review queue · AI Fellows LMS",
  description:
    "The fellows assigned to you and the state of their capstones — sorted with the ones who need a reply first.",
};

export default async function MentorQueuePage() {
  const queue = await getMentorQueueServer();

  // Awaiting-mentor-reply first, then by recency.
  const sorted = [...queue].sort((a, b) => {
    if (a.awaitingMentorReply !== b.awaitingMentorReply) {
      return a.awaitingMentorReply ? -1 : 1;
    }
    return +new Date(b.lastActivityAt) - +new Date(a.lastActivityAt);
  });

  const awaiting = sorted.filter((q) => q.awaitingMentorReply).length;
  const submitted = sorted.filter(
    (q) => q.status === "submitted" || q.status === "under-review"
  ).length;
  const notStarted = sorted.filter((q) => q.status === "not-started").length;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <MentorQueueTour />
      <Breadcrumbs
        items={[
          { label: "Mentor home", href: "/mentor" },
          { label: "Queue" },
        ]}
      />
      <div data-tour="mentor-queue-heading">
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          Review queue
        </h1>
        <p className="mt-2 text-gray-600">
          Fellows assigned to you. Capstones awaiting your reply or sitting in
          your inbox are shown first.
        </p>
      </div>

      <div
        data-tour="mentor-queue-stats"
        className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
      >
        <Stat label="Total fellows" value={String(sorted.length)} />
        <Stat
          label="Awaiting your reply"
          value={String(awaiting)}
          intent={awaiting > 0 ? "warning" : "neutral"}
        />
        <Stat label="Submitted / under review" value={String(submitted)} />
        <Stat
          label="Not started"
          value={String(notStarted)}
          intent={notStarted > 0 ? "warning" : "neutral"}
        />
      </div>

      <section data-tour="mentor-queue-table">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Fellow</th>
                <th className="px-5 py-3">Capstone</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Last activity</th>
                <th className="px-5 py-3 text-right">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((q) => (
                <tr
                  key={q.fellowId}
                  className={
                    q.awaitingMentorReply ? "bg-warning-50/40" : ""
                  }
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <AvatarText name={q.fellowName} className="h-9 w-9" />
                      <div>
                        <div className="font-medium text-gray-800">
                          {q.fellowName}
                          {q.unreadFromFellow > 0 && (
                            <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 px-1.5 text-xs font-semibold text-white">
                              {q.unreadFromFellow}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {q.fellowCountry} · {q.sector}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    {q.capstoneTitle ? (
                      <span className="text-gray-800">{q.capstoneTitle}</span>
                    ) : (
                      <span className="italic text-gray-400">
                        Not yet scoped
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={q.status} />
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {relativeTime(q.lastActivityAt)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/mentor/capstones/${q.fellowId}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-fellowship-navy hover:text-fellowship-navy-dark"
                    >
                      Review
                      <ChevronRightIcon className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
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

function StatusBadge({ status }: { status: CapstoneStatus }) {
  const map: Record<
    CapstoneStatus,
    { color: "info" | "warning" | "success" | "error" | "light"; label: string }
  > = {
    "not-started": { color: "light", label: "Not started" },
    draft: { color: "warning", label: "Draft" },
    submitted: { color: "info", label: "Submitted" },
    "under-review": { color: "info", label: "Under review" },
    approved: { color: "success", label: "Approved" },
    returned: { color: "error", label: "Returned" },
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
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}
