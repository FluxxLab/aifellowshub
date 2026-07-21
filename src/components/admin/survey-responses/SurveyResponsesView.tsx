"use client";
import React, { useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import { cn } from "@/lib/utils";
import { formatCohortShortDate } from "@/lib/datetime";
import { ChevronDownIcon, DownloadIcon } from "@/icons";
import type { SurveyResponseRow } from "@/lib/api/survey-responses.server";

const QUESTION_LABELS: Record<string, string> = {
  q1: "Primary role or sector",
  q2: "Frequency of AI engagement",
  q3: "Global AI governance frameworks familiar with",
  q4: "African/regional AI governance initiatives aware of",
  q5: "Concepts comfortable explaining to a colleague",
  q6: "Response to biased AI in public service delivery",
  q7: "Confidence identifying AI/governance risks",
  q8: "Extent African values should shape AI governance",
  q9: "Most significant AI risk in African contexts",
  q10: "Confidence explaining AI risks to non-technical stakeholders",
  q11: "Frequency of stakeholder engagement on technology/governance",
  q12: "Motivation for applying to fellowship",
  q13: "Most challenging fellowship module",
  q14: "Skills most wanted from fellowship",
  q15: "Intended application of fellowship knowledge",
  q16: "Current AI ethics/governance challenge",
};

function formatAnswer(
  value: unknown,
  otherVal: string | undefined,
): string {
  if (Array.isArray(value)) {
    return (value as string[])
      .map((v) => (v === "Other" && otherVal ? `Other — ${otherVal}` : v))
      .join(" | ");
  }
  const str = String(value ?? "");
  if (str === "Other" && otherVal) return `Other — ${otherVal}`;
  return str;
}

function exportSurveyToCsv(
  rows: SurveyResponseRow[],
  phase: "baseline" | "endline" = "baseline",
) {
  const QUESTION_KEYS = Object.keys(QUESTION_LABELS);
  const headers = [
    "Name",
    "Email",
    "Sector",
    "Country",
    "Submitted",
    ...QUESTION_KEYS.map((k) => QUESTION_LABELS[k]),
  ];

  const escape = (v: string) =>
    v.includes(",") || v.includes('"') || v.includes("\n")
      ? `"${v.replace(/"/g, '""')}"`
      : v;

  const dataRows = rows.map((r) =>
    [
      r.fellow.fullName,
      r.fellow.email,
      r.fellow.sector?.replace(/_/g, " ") ?? "",
      r.fellow.country ?? "",
      new Date(r.submittedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      ...QUESTION_KEYS.map((k) => {
        const val = r.answers[k];
        const other = r.answers[`${k}_other`] as string | undefined;
        return formatAnswer(val, other);
      }),
    ].map(escape),
  );

  const csv =
    "﻿" + // UTF-8 BOM for Excel
    [headers.map(escape), ...dataRows].map((row) => row.join(",")).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    phase === "endline"
      ? "end-of-programme-survey-week9.csv"
      : "pre-fellowship-survey-week1.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/** Which survey is being viewed. Same questions, separate response sets. */
type SurveyPhase = "baseline" | "endline";

const PHASES: { id: SurveyPhase; label: string; blurb: string }[] = [
  {
    id: "baseline",
    label: "Week 1 · Baseline",
    blurb:
      "Pre-fellowship survey submissions, collected at the start of the programme.",
  },
  {
    id: "endline",
    label: "Week 9 · Endline",
    blurb:
      "End-of-programme submissions. Same questions as Week 1 — compare the two to see what changed.",
  },
];

export default function SurveyResponsesView({
  responses,
  endlineResponses = [],
}: {
  responses: SurveyResponseRow[];
  /** Week 9 end-of-programme responses (same questions, separate set). */
  endlineResponses?: SurveyResponseRow[];
}) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [phase, setPhase] = useState<SurveyPhase>("baseline");

  const active = phase === "baseline" ? responses : endlineResponses;
  const activePhase = PHASES.find((p) => p.id === phase)!;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return active;
    return active.filter(
      (r) =>
        r.fellow.fullName.toLowerCase().includes(q) ||
        r.fellow.email.toLowerCase().includes(q) ||
        (r.fellow.sector ?? "").toLowerCase().includes(q) ||
        (r.fellow.country ?? "").toLowerCase().includes(q),
    );
  }, [active, query]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            Survey responses
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {activePhase.blurb} Click a row to view individual answers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge color="info">{active.length} submitted</Badge>
          <button
            type="button"
            onClick={() => exportSurveyToCsv(active, phase)}
            disabled={active.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            Export to Excel
          </button>
        </div>
      </header>

      {/* Week 1 (baseline) vs Week 9 (endline). Same questions, separate
          response sets — kept apart so they're never conflated. */}
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {PHASES.map((p) => {
          const isActive = p.id === phase;
          const count =
            p.id === "baseline" ? responses.length : endlineResponses.length;
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setPhase(p.id);
                setExpandedId(null);
              }}
              className={`relative -mb-px flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-b-2 border-fellowship-navy text-fellowship-navy"
                  : "border-b-2 border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{p.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  isActive
                    ? "bg-fellowship-navy text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, sector, country…"
          className="h-9 w-full max-w-sm rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400"
        />
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center text-gray-500">
          {active.length === 0
            ? phase === "endline"
              ? "No end-of-programme responses yet — fellows submit this in Week 9."
              : "No survey responses yet."
            : "No fellows match the search."}
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <Th>Fellow</Th>
                  <Th>Sector</Th>
                  <Th>Country</Th>
                  <Th>Submitted</Th>
                  <Th className="text-right">Answers</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map((r) => (
                  <React.Fragment key={r.id}>
                    <tr
                      className="cursor-pointer hover:bg-gray-50/60"
                      onClick={() =>
                        setExpandedId((prev) =>
                          prev === r.id ? null : r.id,
                        )
                      }
                    >
                      <td className="px-5 py-3">
                        <p className="font-semibold text-gray-800">
                          {r.fellow.fullName}
                        </p>
                        <p className="text-xs text-gray-500">{r.fellow.email}</p>
                      </td>
                      <td className="px-5 py-3 text-sm capitalize">
                        {r.fellow.sector?.replace(/_/g, " ") ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-sm">
                        {r.fellow.country ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {formatCohortShortDate(r.submittedAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ChevronDownIcon
                          className={cn(
                            "ml-auto h-4 w-4 text-gray-400 transition-transform duration-200",
                            expandedId === r.id && "rotate-180",
                          )}
                        />
                      </td>
                    </tr>
                    {expandedId === r.id && (
                      <tr>
                        <td
                          colSpan={5}
                          className="bg-gray-50/60 px-5 py-4"
                        >
                          <AnswersPanel answers={r.answers} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
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

function AnswersPanel({ answers }: { answers: Record<string, unknown> }) {
  const items = Object.entries(answers).filter(([key]) =>
    QUESTION_LABELS[key],
  );
  const otherItems = Object.entries(answers).filter(([key]) =>
    key.endsWith("_other"),
  );

  const otherMap = Object.fromEntries(otherItems);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map(([key, value]) => {
        const label = QUESTION_LABELS[key];
        const otherKey = `${key}_other`;
        const otherVal = otherMap[otherKey] as string | undefined;

        return (
          <div key={key} className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {label}
            </p>
            <AnswerValue value={value} other={otherVal} />
          </div>
        );
      })}
    </div>
  );
}

function AnswerValue({
  value,
  other,
}: {
  value: unknown;
  other?: string;
}) {
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1">
        {(value as string[]).map((v, i) => (
          <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
            <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-fellowship-navy" />
            {v}
            {v === "Other" && other ? (
              <span className="text-gray-500"> — {other}</span>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  const str = String(value ?? "—");
  const suffix =
    str === "Other" && other ? (
      <span className="text-gray-500"> — {other}</span>
    ) : null;

  return (
    <p className="text-sm text-gray-700">
      {str}
      {suffix}
    </p>
  );
}
