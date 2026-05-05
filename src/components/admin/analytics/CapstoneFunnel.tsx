import React from "react";
import type { CapstoneFunnelPoint } from "@/lib/api/analytics";

export default function CapstoneFunnel({
 data,
 enrolledCount,
}: {
 data: CapstoneFunnelPoint[];
 enrolledCount: number;
}) {
 // Use enrolledCount as the visual scale denominator so each step's bar width
 // is comparable to the cohort total, not just the largest stage.
 const max = Math.max(enrolledCount, ...data.map((d) => d.count));

 return (
 <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
 <div className="mb-4">
 <h2 className="text-base font-semibold text-gray-800">
 Capstone funnel
 </h2>
 <p className="mt-1 text-sm text-gray-500">
 Where capstone projects sit across the cohort.{" "}
 {enrolledCount - data.reduce((s, d) => s + d.count, 0)} fellows
 haven&apos;t started.
 </p>
 </div>
 <ul className="flex flex-col gap-3">
 {data.map((p, i) => {
 const pct = (p.count / max) * 100;
 return (
 <li key={p.status} className="flex items-center gap-4">
 <span className="w-44 shrink-0 text-sm font-medium text-gray-700">
 {i + 1}. {p.label}
 </span>
 <div className="relative flex-1">
 <div className="h-7 w-full overflow-hidden rounded-md bg-gray-100">
 <div
 className={`h-full rounded-md transition-all ${barColor(p.status)}`}
 style={{ width:`${Math.max(pct, 1)}%`}}
 />
 </div>
 </div>
 <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-gray-800">
 {p.count}
 </span>
 </li>
 );
 })}
 </ul>
 </section>
 );
}

function barColor(status: CapstoneFunnelPoint["status"]): string {
 switch (status) {
 case "approved":
 return "bg-success-500";
 case "under-review":
 return "bg-warning-400";
 case "submitted":
 return "bg-blue-light-500";
 case "revision-required":
 return "bg-error-400";
 default:
 return "bg-gray-400";
 }
}
