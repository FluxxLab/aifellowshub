"use client";
import React, { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { ChevronLeftIcon, MoreDotIcon } from "@/icons";
import type { AssessmentDetail } from "@/lib/api/assessments";

export default function AssessmentDetailHeader({
 assessment,
 pendingCount,
}: {
 assessment: AssessmentDetail;
 pendingCount: number;
}) {
 const [menuOpen, setMenuOpen] = useState(false);
 const passRate =
 assessment.attemptsCount === 0
 ? null
 : Math.round((assessment.passedCount / assessment.attemptsCount) * 100);

 return (
 <div className="flex flex-col gap-4">
 <Link
 href="/assessments" className="inline-flex w-fit items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700">
 <ChevronLeftIcon className="h-4 w-4"/>
 Back to assessments
 </Link>

 <div className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
 <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
 <div className="min-w-0 flex-1">
 <div className="mb-2 flex flex-wrap items-center gap-2">
 {assessment.isPublished ? (
 <Badge color="success">Published</Badge>
 ) : (
 <Badge color="light">Draft</Badge>
 )}
 {assessment.weekNumber !== null && (
 <span className="text-xs font-semibold uppercase tracking-[0.18em] text-fellowship-navy">
 Week {assessment.weekNumber}
 </span>
 )}
 </div>
 <h1 className="text-title-sm font-bold text-gray-800 sm:text-title-md">
 {assessment.title}
 </h1>
 {assessment.moduleTitle && (
 <p className="mt-1 text-sm text-gray-500">
 {assessment.moduleTitle}
 </p>
 )}
 <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500">
 {assessment.description}
 </p>
 </div>

 <div className="flex shrink-0 items-center gap-2">
 <Button
 variant={assessment.isPublished ?"outline":"fellowship"}
 size="sm">
 {assessment.isPublished ?"Unpublish":"Publish"}
 </Button>
 <div className="relative">
 <button
 type="button" aria-label="Assessment actions" aria-haspopup="menu" aria-expanded={menuOpen}
 onClick={() => setMenuOpen((v) => !v)}
 className="dropdown-toggle inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50">
 <MoreDotIcon className="h-5 w-5"/>
 </button>
 <Dropdown
 isOpen={menuOpen}
 onClose={() => setMenuOpen(false)}
 className="w-48 p-1">
 <ul role="menu" className="flex flex-col gap-0.5">
 <Item onClick={() => setMenuOpen(false)}>Edit metadata</Item>
 <Item onClick={() => setMenuOpen(false)}>Duplicate</Item>
 <Item onClick={() => setMenuOpen(false)}>Preview as fellow</Item>
 <Item onClick={() => setMenuOpen(false)}>Export results CSV</Item>
 <Item destructive onClick={() => setMenuOpen(false)}>
 Delete
 </Item>
 </ul>
 </Dropdown>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 sm:grid-cols-4">
 <Stat label="Questions" value={String(assessment.questionCount)} />
 <Stat
 label="Attempts" value={`${assessment.attemptsCount}`}
 />
 <Stat
 label="Pass rate" value={
 passRate !== null
 ?`${passRate}% · ${assessment.passedCount}/${assessment.attemptsCount}`:"—"}
 />
 <Stat
 label="Awaiting grading" value={String(pendingCount)}
 tone={pendingCount > 0 ?"danger": undefined}
 />
 </div>
 </div>
 </div>
 );
}

function Stat({
 label,
 value,
 tone,
}: {
 label: string;
 value: string;
 tone?:"danger";
}) {
 return (
 <div>
 <div className="text-xs font-medium uppercase tracking-wider text-gray-400">
 {label}
 </div>
 <div
 className={`mt-1 text-base font-semibold tabular-nums ${
 tone ==="danger"?"text-error-600":"text-gray-800"}`}
 >
 {value}
 </div>
 </div>
 );
}

function Item({
 children,
 onClick,
 destructive,
}: {
 children: React.ReactNode;
 onClick: () => void;
 destructive?: boolean;
}) {
 return (
 <li role="none">
 <DropdownItem
 onClick={onClick}
 baseClassName="block w-full rounded-md text-left px-3 py-2 text-sm font-medium transition-colors" className={
 destructive
 ?"text-error-600 hover:bg-error-50":"text-gray-700 hover:bg-gray-100 hover:text-gray-900"}
 >
 {children}
 </DropdownItem>
 </li>
 );
}
