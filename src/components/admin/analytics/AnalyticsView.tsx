"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { ChevronDownIcon, DownloadIcon } from "@/icons";
import type { AnalyticsSummary } from "@/lib/api/analytics";
import ModulePerformanceTable from "./ModulePerformanceTable";
import AssessmentDistributionsChart from "./AssessmentDistributionsChart";
import CapstoneFunnel from "./CapstoneFunnel";

type AnalyticsViewProps = {
 summary: AnalyticsSummary;
};

export default function AnalyticsView({ summary }: AnalyticsViewProps) {
 return (
 <div className="flex flex-col gap-4 md:gap-6">
 <Header summary={summary} />
 <TotalsStrip summary={summary} />
 <ModulePerformanceTable
 data={summary.modulePerformance}
 currentWeek={summary.currentWeek}
 />
 <AssessmentDistributionsChart
 distributions={summary.assessmentDistributions}
 />
 <CapstoneFunnel
 data={summary.capstoneFunnel}
 enrolledCount={summary.enrolledCount}
 />
 </div>
 );
}

function Header({ summary }: { summary: AnalyticsSummary }) {
 return (
 <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
 <div>
 <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fellowship-navy">
 {summary.cohortName} · Week {summary.currentWeek} of {summary.totalWeeks}
 </p>
 <h1 className="mt-1 text-title-md font-bold text-gray-800">
 Analytics
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 Module performance, assessment outcomes, and capstone progression for
 the active cohort.
 </p>
 </div>
 <ExportMenu />
 </div>
 );
}

function ExportMenu() {
 const [open, setOpen] = useState(false);

 const handleExport = (kind: string) => {
 setOpen(false);
 // Phase 1 (UI-first): export is mocked.
 // Phase 2: GET /analytics/export?type=… → download CSV stream.
 if (typeof window !=="undefined") {
 const blob = new Blob(
 [`# Mock CSV export — ${kind}\n# Phase 2 will stream from GET /analytics/export?type=${encodeURIComponent(kind)}\n`,
 ],
 { type:"text/csv"}
 );
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download =`${kind.toLowerCase().replace(/\s+/g,"-")}-mock.csv`;
 a.click();
 URL.revokeObjectURL(url);
 }
 };

 return (
 <div className="relative">
 <Button
 variant="outline" size="sm" onClick={() => setOpen((v) => !v)}
 startIcon={<DownloadIcon />}
 endIcon={<ChevronDownIcon className="h-4 w-4"/>}
 className="dropdown-toggle">
 Export CSV
 </Button>
 <Dropdown
 isOpen={open}
 onClose={() => setOpen(false)}
 className="w-56 p-1">
 <ul role="menu" className="flex flex-col gap-0.5">
 <ExportItem onClick={() => handleExport("Module performance")}>
 Module performance
 </ExportItem>
 <ExportItem onClick={() => handleExport("Assessment scores")}>
 Assessment scores
 </ExportItem>
 <ExportItem onClick={() => handleExport("Session attendance")}>
 Session attendance
 </ExportItem>
 <ExportItem onClick={() => handleExport("Capstone status")}>
 Capstone status
 </ExportItem>
 <ExportItem onClick={() => handleExport("Per-fellow timeline")}>
 Per-fellow timeline
 </ExportItem>
 </ul>
 </Dropdown>
 </div>
 );
}

function ExportItem({
 children,
 onClick,
}: {
 children: React.ReactNode;
 onClick: () => void;
}) {
 return (
 <li role="none">
 <DropdownItem
 onClick={onClick}
 baseClassName="block w-full rounded-md text-left px-3 py-2 text-sm font-medium transition-colors" className="text-gray-700 hover:bg-gray-100 hover:text-gray-900">
 {children}
 </DropdownItem>
 </li>
 );
}

function TotalsStrip({ summary }: { summary: AnalyticsSummary }) {
 const t = summary.totals;
 const passRate =
 t.totalAssessmentAttempts === 0
 ? 0
 : Math.round((t.totalAssessmentPasses / t.totalAssessmentAttempts) * 100);

 return (
 <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
 <Stat
 label="Enrolled fellows" value={String(summary.enrolledCount)}
 sub={`${summary.cohortName}`}
 />
 <Stat
 label="Assessment attempts" value={String(t.totalAssessmentAttempts)}
 sub={`${t.totalAssessmentPasses} passed (${passRate}%)`}
 />
 <Stat
 label="Capstones submitted" value={String(t.totalCapstonesSubmitted)}
 sub={`Out of ${summary.enrolledCount} enrolled`}
 />
 <Stat
 label="Certificates issued" value={String(t.totalCertificatesIssued)}
 sub="Cumulative, all courses"/>
 </div>
 );
}

function Stat({
 label,
 value,
 sub,
}: {
 label: string;
 value: string;
 sub: string;
}) {
 return (
 <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
 <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
 {label}
 </span>
 <h4 className="mt-1 font-bold text-gray-800 text-title-sm">
 {value}
 </h4>
 <span className="mt-1 block text-xs text-gray-500">
 {sub}
 </span>
 </div>
 );
}
