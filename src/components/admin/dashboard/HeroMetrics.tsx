"use client";
import React from "react";
import Badge from "@/components/ui/badge/Badge";
import CountUp from "@/components/ui/motion/CountUp";
import { motion, useReducedMotion } from "motion/react";
import {
 ArrowDownIcon,
 ArrowUpIcon,
 BoxIconLine,
 CalenderIcon,
 CheckCircleIcon,
 GroupIcon,
 UsersRoundIcon,
} from "@/icons";
import type { DashboardSummary } from "@/lib/api/dashboard";

type HeroMetricsProps = {
 metrics: DashboardSummary["metrics"];
};

export default function HeroMetrics({ metrics }: HeroMetricsProps) {
 const reduce = useReducedMotion();
 const container = reduce
   ? undefined
   : {
       hidden: { opacity: 0 },
       show: {
         opacity: 1,
         transition: { staggerChildren: 0.08 },
       },
     };

 return (
 <motion.div
   data-tour="dashboard-metrics"
   // 5 tiles total — 5 across at xl (1280+), 3 at lg, 2 at sm.
   // The "5 across at xl, 3 at lg" jump is intentional: 4-col at lg
   // would strand the 5th tile alone on row 2; 3-col gives a clean
   // 3 + 2 split that doesn't look orphaned.
   className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-6"
   variants={container}
   initial={reduce ? false : "hidden"}
   animate={reduce ? false : "show"}
 >
 <MetricCard
 icon={<GroupIcon className="text-fellowship-navy size-6"/>}
 label="Active fellows"
 valueNode={
   <>
     <CountUp value={metrics.activeFellows.value} /> /{" "}
     {metrics.activeFellows.capacity}
   </>
 }
 delta={metrics.activeFellows.deltaPercent}
 deltaIntent="goodIfUp"/>
 <MetricCard
 icon={<UsersRoundIcon className="text-fellowship-navy"/>}
 label="Mentors"
 valueNode={<CountUp value={metrics.mentorsTotal.value} />}
 delta={metrics.mentorsTotal.deltaPercent}
 deltaIntent="neutral"/>
 <MetricCard
 icon={<BoxIconLine className="text-fellowship-navy"/>}
 label="Avg cohort progress"
 valueNode={<CountUp value={metrics.avgProgressPercent.value} suffix="%" />}
 delta={metrics.avgProgressPercent.deltaPercent}
 deltaIntent="goodIfUp"/>
 <MetricCard
 icon={<CalenderIcon className="text-fellowship-navy"/>}
 label="Attendance rate (7d)"
 valueNode={<CountUp value={metrics.attendanceRatePercent.value} suffix="%" />}
 delta={metrics.attendanceRatePercent.deltaPercent}
 deltaIntent="goodIfUp"/>
 <MetricCard
 icon={<CheckCircleIcon className="text-fellowship-navy"/>}
 label="Capstones in review"
 valueNode={<CountUp value={metrics.capstonesAwaitingReview.value} />}
 delta={metrics.capstonesAwaitingReview.deltaPercent}
 deltaIntent="neutral"/>
 </motion.div>
 );
}

type MetricCardProps = {
 icon: React.ReactNode;
 label: string;
 valueNode: React.ReactNode;
 delta: number;
 /**
 * Whether an upward delta should read as positive (most metrics) or just informational.
 *"goodIfUp"→ up = green, down = red
 *"neutral"→ both directions are neutral colour
 */
 deltaIntent:"goodIfUp"|"neutral";
};

function MetricCard({ icon, label, valueNode, delta, deltaIntent }: MetricCardProps) {
 const reduce = useReducedMotion();
 const isUp = delta >= 0;
 const color:"success"|"error"|"info"=
 deltaIntent ==="neutral"?"info": isUp ?"success":"error";
 const formatted =`${isUp ?"":""}${Math.abs(delta).toFixed(1)}%`;

 const cardVariants = reduce
   ? undefined
   : {
       hidden: { opacity: 0, y: 12 },
       show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
     };

 return (
 <motion.div
   variants={cardVariants}
   whileHover={reduce ? undefined : { y: -2 }}
   transition={{ type: "spring", stiffness: 300, damping: 22 }}
   className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
 >
 <div className="flex items-center justify-center w-12 h-12 bg-warning-100 rounded-xl">
 {icon}
 </div>
 <div className="flex items-end justify-between mt-5">
 <div>
 <span className="text-sm text-gray-500">{label}</span>
 <h4 className="mt-2 font-bold text-gray-800 text-title-sm">
 {valueNode}
 </h4>
 </div>
 <Badge color={color}>
 {isUp ? <ArrowUpIcon /> : <ArrowDownIcon />}
 {formatted}
 </Badge>
 </div>
 </motion.div>
 );
}
