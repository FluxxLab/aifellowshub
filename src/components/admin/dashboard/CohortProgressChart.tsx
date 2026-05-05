"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import type { DashboardSummary } from "@/lib/api/dashboard";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
 ssr: false,
});

type CohortProgressChartProps = {
 cohortName: string;
 data: DashboardSummary["cohortProgress"];
};

export default function CohortProgressChart({
 cohortName,
 data,
}: CohortProgressChartProps) {
 const options: ApexOptions = {
 colors: ["#002d74"], // fellowship-navy
 chart: {
 fontFamily:"inherit",
 type:"line",
 height: 280,
 toolbar: { show: false },
 zoom: { enabled: false },
 },
 stroke: {
 curve:"smooth",
 width: 3,
 },
 markers: {
 size: 4,
 colors: ["#002d74"],
 strokeColors:"#ffffff",
 strokeWidth: 2,
 hover: { size: 6 },
 },
 dataLabels: { enabled: false },
 xaxis: {
 categories: data.map((d) =>`W${d.weekNumber}`),
 axisBorder: { show: false },
 axisTicks: { show: false },
 labels: {
 style: { fontFamily:"inherit"},
 },
 },
 yaxis: {
 min: 0,
 max: 100,
 labels: {
 formatter: (val: number) =>`${val}%`,
 style: { fontFamily:"inherit"},
 },
 },
 grid: {
 borderColor:"#e4e7ec",
 strokeDashArray: 4,
 },
 tooltip: {
 x: { formatter: (val) =>`Week ${val}`},
 y: { formatter: (val: number) =>`${val}% complete`},
 },
 legend: { show: false },
 };

 // Replace zero/future weeks with null so the line stops at the current week
 // instead of dropping back to 0 — visually clearer that those weeks are unrun.
 const series = [
 {
 name:"Avg completion",
 data: data.map((d) => (d.avgCompletionPercent === 0 ? null : d.avgCompletionPercent)),
 },
 ];

 return (
 <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 sm:px-6 sm:pt-6">
 <div className="mb-2 flex items-start justify-between">
 <div>
 <h3 className="text-lg font-semibold text-gray-800">
 Cohort progress
 </h3>
 <p className="mt-1 text-sm text-gray-500">
 Average module completion across {cohortName}, week by week.
 </p>
 </div>
 </div>
 <div className="max-w-full overflow-x-auto custom-scrollbar">
 <div className="-ml-2 min-w-[480px] sm:min-w-[600px] xl:min-w-full">
 <ReactApexChart
 options={options}
 series={series}
 type="line" height={280}
 />
 </div>
 </div>
 </div>
 );
}
