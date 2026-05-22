"use client";
import { DownloadIcon } from "@/icons";

type Submission = {
  id: string;
  overallRating: number;
  contentRating: number;
  sessionRating: number;
  mentorRating: number;
  whatWorked: string | null;
  whatDidnt: string | null;
  submittedAt: string;
};

export default function FeedbackExportButton({
  submissions,
  moduleId,
}: {
  submissions: Submission[];
  moduleId: string;
}) {
  function exportCsv() {
    const headers = [
      "Date",
      "Overall",
      "Content",
      "Sessions",
      "Facilitator",
      "What Worked",
      "What Didn't",
    ];

    const rows = submissions.map((s) => [
      new Date(s.submittedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      String(s.overallRating),
      String(s.contentRating),
      String(s.sessionRating),
      String(s.mentorRating),
      s.whatWorked ?? "",
      s.whatDidnt ?? "",
    ]);

    const escape = (v: string) =>
      v.includes(",") || v.includes('"') || v.includes("\n")
        ? `"${v.replace(/"/g, '""')}"`
        : v;

    // UTF-8 BOM so Excel recognises the encoding on Windows
    const csv =
      "﻿" +
      [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-${moduleId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={exportCsv}
      disabled={submissions.length === 0}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <DownloadIcon className="h-3.5 w-3.5" />
      Export to Excel
    </button>
  );
}
