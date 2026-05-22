"use client";
import { useState } from "react";
import { toast } from "@/lib/toast";

type Props = { sessionId: string };

export default function AiAttendanceReport({ sessionId }: Props) {
  const [report, setReport] = useState<string | null>(null);
  const [stubbed, setStubbed] = useState(false);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/sessions/${encodeURIComponent(sessionId)}/attendance-report`,
        { method: "POST", credentials: "include" },
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Failed (${res.status})`);
      }
      const data = (await res.json()) as { report: string; stubbed: boolean };
      setReport(data.report);
      setStubbed(data.stubbed);
    } catch (err) {
      toast.errorFromException("Couldn't generate report", err);
    }
    setLoading(false);
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white">
      <header className="flex items-center justify-between p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold text-gray-800">AI Attendance Report</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            AI analysis of attendance patterns and anomalies for this session.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading}
          className="rounded-lg border border-brand-500 bg-white px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 disabled:opacity-50"
        >
          {loading ? "Generating…" : report ? "Regenerate" : "Generate Report"}
        </button>
      </header>

      {report && (
        <div className="border-t border-gray-100 px-5 pb-6 pt-4 sm:px-6">
          {stubbed && (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 border border-amber-200">
              AI narrative unavailable — showing structured summary. Set <code>ANTHROPIC_API_KEY</code> to enable full reports.
            </p>
          )}
          <div className="prose prose-sm max-w-none text-gray-700 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-800 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-gray-700 [&_ul]:mt-1 [&_li]:text-sm">
            <MarkdownReport content={report} />
          </div>
        </div>
      )}
    </section>
  );
}

function MarkdownReport({ content }: { content: string }) {
  // Lightweight markdown render — bold, headings, bullet lists, line breaks.
  // Avoids pulling in a full markdown library for a single admin widget.
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={elements.length} className="my-2 list-disc pl-5 space-y-1">
        {listItems.map((item, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("## ")) {
      flushList();
      elements.push(<h2 key={elements.length}>{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      flushList();
      elements.push(<h3 key={elements.length}>{line.slice(4)}</h3>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      listItems.push(line.slice(2));
    } else if (line === "") {
      flushList();
      elements.push(<br key={elements.length} />);
    } else {
      flushList();
      elements.push(
        <p
          key={elements.length}
          className="my-1"
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }}
        />,
      );
    }
  }
  flushList();
  return <>{elements}</>;
}

function inlineFormat(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code class='rounded bg-gray-100 px-1 text-xs'>$1</code>");
}
