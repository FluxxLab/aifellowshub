"use client";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import type { EngagementPoint } from "@/lib/api/dashboard";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
 ssr: false,
});

type EngagementTrendChartProps = {
 data: EngagementPoint[];
};

export default function EngagementTrendChart({
 data,
}: EngagementTrendChartProps) {
 const options: ApexOptions = {
 colors: ["#002d74","#fdb022"], // fellowship-navy, warning-400
 chart: {
 fontFamily:"inherit",
 type:"area",
 height: 280,
 stacked: true,
 toolbar: { show: false },
 zoom: { enabled: false },
 },
 responsive: [{ breakpoint: 640, options: { chart: { height: 200 } } }],
 stroke: { curve:"smooth", width: 2 },
 fill: {
 type:"gradient",
 gradient: {
 shadeIntensity: 0.3,
 opacityFrom: 0.45,
 opacityTo: 0.05,
 stops: [0, 100],
 },
 },
 dataLabels: { enabled: false },
 xaxis: {
 type:"datetime",
 categories: data.map((d) => d.date),
 axisBorder: { show: false },
 axisTicks: { show: false },
 labels: {
 format:"MMM d",
 style: { fontFamily:"inherit"},
 },
 },
 yaxis: {
 min: 0,
 labels: {
 style: { fontFamily:"inherit"},
 },
 },
 grid: { borderColor:"#e4e7ec", strokeDashArray: 4 },
 legend: {
 show: true,
 position:"top",
 horizontalAlign:"left",
 fontFamily:"inherit",
 markers: { strokeWidth: 0 },
 },
 tooltip: { x: { format:"ddd, MMM d"} },
 };

 const series = [
 {
 name:"Forum messages",
 data: data.map((d) => d.forumMessages),
 },
 {
 name:"AI Buddy messages",
 data: data.map((d) => d.aiBuddyMessages),
 },
 ];

 return (
 <div className="rounded-2xl border border-gray-200 bg-white px-5 pt-5 sm:px-6 sm:pt-6">
 <div className="mb-4 flex items-start justify-between">
 <div>
 <h3 className="text-lg font-semibold text-gray-800">
 Engagement
 </h3>
 <p className="mt-1 text-sm text-gray-500">
 Daily forum + AI Buddy activity, last 14 days.
 </p>
 </div>
 </div>
 <div className="-ml-2 pb-2">
 <ReactApexChart
 options={options}
 series={series}
 type="area" height={280}
 />
 </div>
 </div>
 );
}
