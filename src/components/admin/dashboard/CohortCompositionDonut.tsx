"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import type { SectorSlice } from "@/lib/api/dashboard";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
 ssr: false,
});

type CohortCompositionDonutProps = {
 data: SectorSlice[];
};

// Palette derived from existing tokens — varied enough to read at-a-glance,
// muted enough to live alongside the navy/gold brand.
const PALETTE = ["#002d74", // fellowship-navy"#fdb022", // warning-400"#0ba5ec", // blue-light-500"#12b76a", // success-500"#7a5af8", // theme-purple-500"#98a2b3", // gray-400 (Other / fallback)
];

export default function CohortCompositionDonut({
 data,
}: CohortCompositionDonutProps) {
 const total = data.reduce((sum, d) => sum + d.count, 0);

 const options: ApexOptions = {
 colors: PALETTE.slice(0, data.length),
 chart: {
 fontFamily:"inherit",
 type:"donut",
 height: 280,
 },
 labels: data.map((d) => d.sector),
 stroke: { width: 2, colors: ["#ffffff"] },
 dataLabels: { enabled: false },
 legend: {
 position:"bottom",
 horizontalAlign:"center",
 fontFamily:"inherit",
 markers: { strokeWidth: 0 },
 itemMargin: { horizontal: 8, vertical: 4 },
 },
 plotOptions: {
 pie: {
 donut: {
 size:"68%",
 labels: {
 show: true,
 name: {
 show: true,
 fontFamily:"inherit",
 fontSize:"14px",
 color:"#667085",
 },
 value: {
 show: true,
 fontFamily:"inherit",
 fontSize:"26px",
 fontWeight: 700,
 color:"#101828",
 formatter: (val: string) =>`${val}`,
 },
 total: {
 show: true,
 label:"Fellows",
 fontFamily:"inherit",
 fontSize:"14px",
 color:"#667085",
 formatter: () =>`${total}`,
 },
 },
 },
 },
 },
 tooltip: {
 theme: "light",
 style: { fontFamily: "inherit", fontSize: "13px" },
 y: {
 formatter: (val: number) =>`${val} fellow${val === 1 ?"":"s"} (${Math.round((val / total) * 100)}%)`,
 },
 },
 };

 const series = data.map((d) => d.count);

 return (
 <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white px-5 pt-5 sm:px-6 sm:pt-6">
 <div className="mb-2">
 <h3 className="text-lg font-semibold text-gray-800">
 Cohort by sector
 </h3>
 <p className="mt-1 text-sm text-gray-500">
 Where fellows work today.
 </p>
 </div>
 <div className="flex flex-1 items-center justify-center pb-4">
 <ReactApexChart
 options={options}
 series={series}
 type="donut" height={280}
 />
 </div>
 </div>
 );
}
