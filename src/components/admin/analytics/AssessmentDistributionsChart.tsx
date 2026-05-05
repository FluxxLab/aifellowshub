"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import type { AssessmentDistribution } from "@/lib/api/analytics";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
 ssr: false,
});

export default function AssessmentDistributionsChart({
 distributions,
}: {
 distributions: AssessmentDistribution[];
}) {
 if (distributions.length === 0) {
 return (
 <section className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
 No assessment attempts yet.
 </section>
 );
 }

 // Use the first distribution's bucket labels as the categories. They differ
 // slightly by pass-mark, but the ranges are consistent enough for an overview.
 const categories = distributions[0].buckets.map((b) => b.label);

 const series = distributions.map((d) => ({
 name:
 d.weekNumber !== null
 ?`W${String(d.weekNumber).padStart(2,"0")} · ${shortenTitle(d.assessmentTitle)}`: shortenTitle(d.assessmentTitle),
 data: d.buckets.map((b) => b.count),
 }));

 const options: ApexOptions = {
 colors: PALETTE.slice(0, distributions.length),
 chart: {
 fontFamily:"inherit",
 type:"bar",
 height: 360,
 stacked: false,
 toolbar: { show: false },
 },
 plotOptions: {
 bar: {
 horizontal: false,
 columnWidth:"70%",
 borderRadius: 4,
 borderRadiusApplication:"end",
 },
 },
 dataLabels: { enabled: false },
 stroke: { show: true, width: 2, colors: ["transparent"] },
 xaxis: {
 categories,
 title: {
 text:"Score band",
 style: { fontFamily:"inherit", fontSize:"12px", fontWeight: 500 },
 },
 axisBorder: { show: false },
 axisTicks: { show: false },
 labels: { style: { fontFamily:"inherit"} },
 },
 yaxis: {
 title: {
 text:"Fellows",
 style: { fontFamily:"inherit", fontSize:"12px", fontWeight: 500 },
 },
 labels: { style: { fontFamily:"inherit"} },
 },
 grid: { borderColor:"#e4e7ec", strokeDashArray: 4 },
 legend: {
 position:"bottom",
 fontFamily:"inherit",
 markers: { strokeWidth: 0 },
 itemMargin: { horizontal: 8, vertical: 4 },
 },
 fill: { opacity: 1 },
 tooltip: { y: { formatter: (val: number) =>`${val} fellows`} },
 };

 return (
 <section className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 sm:px-6 sm:pt-6">
 <div className="mb-3">
 <h2 className="text-base font-semibold text-gray-800">
 Assessment score distributions
 </h2>
 <p className="mt-1 text-sm text-gray-500">
 How fellows scored across each published assessment. Spotting the
 band where most fellows land tells you whether an assessment was too
 easy, too hard, or about right.
 </p>
 </div>
 <div className="max-w-full overflow-x-auto custom-scrollbar">
 <div className="-ml-2 min-w-[480px] sm:min-w-[640px] xl:min-w-full pb-2">
 <ReactApexChart
 options={options}
 series={series}
 type="bar" height={360}
 />
 </div>
 </div>
 </section>
 );
}

const PALETTE = ["#002d74", // fellowship-navy"#fdb022", // warning-400"#0ba5ec", // blue-light-500"#12b76a", // success-500"#7a5af8", // theme-purple-500"#f04438", // error-500"#fb6514", // orange-500"#98a2b3", // gray-400
];

function shortenTitle(title: string): string {
 // Keep titles short for the legend.
 return title.length > 40 ? title.slice(0, 38) +"…": title;
}
