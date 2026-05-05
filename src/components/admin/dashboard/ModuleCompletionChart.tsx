"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import type { ModuleCompletion } from "@/lib/api/dashboard";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
 ssr: false,
});

type ModuleCompletionChartProps = {
 data: ModuleCompletion[];
};

export default function ModuleCompletionChart({
 data,
}: ModuleCompletionChartProps) {
 const options: ApexOptions = {
 colors: ["#002d74","#fdb022"], // fellowship-navy, warning-400
 chart: {
 fontFamily:"inherit",
 type:"bar",
 height: 320,
 stacked: false,
 toolbar: { show: false },
 },
 plotOptions: {
 bar: {
 horizontal: false,
 columnWidth:"55%",
 borderRadius: 4,
 borderRadiusApplication:"end",
 },
 },
 dataLabels: { enabled: false },
 stroke: { show: true, width: 2, colors: ["transparent"] },
 xaxis: {
 categories: data.map((m) =>`W${m.weekNumber}`),
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
 legend: {
 show: true,
 position:"top",
 horizontalAlign:"left",
 fontFamily:"inherit",
 markers: { strokeWidth: 0 },
 },
 fill: { opacity: 1 },
 tooltip: {
 x: {
 formatter: (_, opts) => {
 const idx = opts.dataPointIndex;
 const m = data[idx];
 return m ?`Week ${m.weekNumber} · ${m.shortTitle}`:"";
 },
 },
 y: { formatter: (val: number) =>`${val}%`},
 },
 };

 const series = [
 { name:"Attended live", data: data.map((m) => m.attendedPercent) },
 { name:"Passed assessment", data: data.map((m) => m.assessmentPassedPercent) },
 ];

 return (
 <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 sm:px-6 sm:pt-6">
 <div className="mb-4 flex items-start justify-between">
 <div>
 <h3 className="text-lg font-semibold text-gray-800">
 Module completion
 </h3>
 <p className="mt-1 text-sm text-gray-500">
 Attendance vs. assessment pass rate, per module.
 </p>
 </div>
 </div>
 <div className="max-w-full overflow-x-auto custom-scrollbar">
 <div className="-ml-2 min-w-[520px] sm:min-w-[700px] xl:min-w-full pb-2">
 <ReactApexChart
 options={options}
 series={series}
 type="bar" height={320}
 />
 </div>
 </div>
 </div>
 );
}
