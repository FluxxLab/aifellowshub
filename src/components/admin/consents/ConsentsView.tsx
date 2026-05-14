"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { cn } from "@/lib/utils";
import { formatCohortShortDate } from "@/lib/datetime";
import type { FellowConsentRow } from "@/lib/api/consents.server";

type Filter = "all" | "signed" | "outstanding";

/**
 * Admin consent register. Shows every fellow's current acceptance
 * state, lets admins drill into a single fellow's signed document,
 * and offers a CSV bulk download. No mutations — every row is
 * read-only; admins can't "un-sign" on a fellow's behalf.
 */
export default function ConsentsView({
  initial,
}: {
  initial: FellowConsentRow[];
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const subset = initial.filter((r) => {
      if (filter === "signed" && !r.bothSigned) return false;
      if (filter === "outstanding" && r.bothSigned) return false;
      return true;
    });
    if (!query.trim()) return subset;
    const q = query.trim().toLowerCase();
    return subset.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.country ?? "").toLowerCase().includes(q) ||
        (r.consentCountry ?? "").toLowerCase().includes(q),
    );
  }, [initial, filter, query]);

  const totals = useMemo(() => {
    const signed = initial.filter((r) => r.bothSigned).length;
    return { signed, total: initial.length };
  }, [initial]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            Fellow consents
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Code of Conduct and Data Protection acceptances on file. Click a
            row to view the signed document; admins can&apos;t edit a fellow&apos;s
            acceptance.
          </p>
        </div>
        <a
          href="/api/admin/consents/export"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          download
        >
          Download CSV
        </a>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(["all", "signed", "outstanding"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  filter === f
                    ? "bg-fellowship-navy text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                )}
              >
                {f === "all"
                  ? `All (${initial.length})`
                  : f === "signed"
                    ? `Signed (${totals.signed})`
                    : `Outstanding (${initial.length - totals.signed})`}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, country…"
            className="h-9 w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <Th>Fellow</Th>
                <Th>Country</Th>
                <Th>Code of Conduct</Th>
                <Th>Data Protection</Th>
                <Th>Opt-ins</Th>
                <Th className="text-right">Action</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-500">
                    No fellows match the current filter.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-800">{r.fullName}</p>
                      <p className="text-xs text-gray-500">{r.email}</p>
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {r.consentCountry ?? r.country ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <SignedCell at={r.codeOfConductAcceptedAt} />
                    </td>
                    <td className="px-5 py-3">
                      <SignedCell at={r.dataConsentAcceptedAt} />
                    </td>
                    <td className="px-5 py-3 text-xs">
                      <OptInChips
                        recording={r.consentRecordingOptIn}
                        comms={r.consentCommsOptIn}
                        alumni={r.consentAlumniCommsOptIn}
                        anySigned={r.dataConsentAcceptedAt !== null}
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/consents/${r.id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-fellowship-navy hover:underline"
                      >
                        View document
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={cn("px-5 py-3 text-left", className)}>{children}</th>
  );
}

function SignedCell({ at }: { at: string | null }) {
  if (!at) {
    return <Badge color="warning">Not signed</Badge>;
  }
  return (
    <div className="flex flex-col">
      <Badge color="success">Signed</Badge>
      <span className="mt-1 text-xs text-gray-500">
        {formatCohortShortDate(at)}
      </span>
    </div>
  );
}

function OptInChips({
  recording,
  comms,
  alumni,
  anySigned,
}: {
  recording: boolean;
  comms: boolean;
  alumni: boolean;
  anySigned: boolean;
}) {
  if (!anySigned) return <span className="text-gray-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      <Chip label="Recording" on={recording} />
      <Chip label="Comms" on={comms} />
      <Chip label="Alumni" on={alumni} />
    </div>
  );
}

function Chip({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        on
          ? "border-success-200 bg-success-50 text-success-700"
          : "border-gray-200 bg-gray-50 text-gray-500",
      )}
    >
      {on ? "✓" : "✕"} {label}
    </span>
  );
}
