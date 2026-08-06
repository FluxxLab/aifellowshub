import React from "react";
import { CheckLineIcon } from "@/icons";
import type { CapstoneMilestone } from "@/lib/api/fellow-capstone";

/**
 * Capstone milestone tracker, derived server-side from the capstone's stage
 * and status.
 *
 * Shared by the fellow's own page and the mentor's review page: a mentor
 * deciding whether to approve a stage needs to see where the fellow is in the
 * progression, which was previously only visible to the fellow.
 */
export function CapstoneMilestones({
  milestones,
  title = "Milestones",
}: {
  milestones: CapstoneMilestone[];
  title?: string;
}) {
  if (milestones.length === 0) return null;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {title}
      </p>
      <ol className="mt-3 space-y-3">
        {milestones.map((m) => (
          <li key={m.id} className="flex items-start gap-3 text-sm">
            <MilestoneOrb status={m.status} />
            <div className="flex-1">
              <p
                className={`font-medium ${
                  m.status === "complete"
                    ? "text-gray-500 line-through"
                    : m.status === "overdue"
                      ? "text-error-700"
                      : "text-gray-800"
                }`}
              >
                {m.title}
              </p>
              {m.dueAt && (
                <p className="text-xs text-gray-500">
                  {m.weekNumber ? `Week ${m.weekNumber} · ` : ""}
                  {new Date(m.dueAt).toLocaleDateString(undefined, {
                    timeZone: "Africa/Lagos",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function MilestoneOrb({
  status,
}: {
  status: CapstoneMilestone["status"];
}) {
  if (status === "complete") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-600">
        <CheckLineIcon className="h-3 w-3" />
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-fellowship-navy bg-white" />
    );
  }
  if (status === "overdue") {
    return (
      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-error-500 bg-error-50" />
    );
  }
  return (
    <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-gray-200 bg-white" />
  );
}
