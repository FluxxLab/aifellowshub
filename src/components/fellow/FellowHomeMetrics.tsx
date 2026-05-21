"use client";
import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import CountUp from "@/components/ui/motion/CountUp";
import {
  BoltIcon,
  BoxIconLine,
  CalenderIcon,
  CheckCircleIcon,
} from "@/icons";
import type { FellowHome } from "@/lib/api/fellow-home.server";

type Props = { metrics: FellowHome["metrics"] };

export default function FellowHomeMetrics({ metrics }: Props) {
  const reduce = useReducedMotion();
  const container = reduce
    ? undefined
    : {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.08 } },
      };

  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6"
      variants={container}
      initial={reduce ? false : "hidden"}
      animate={reduce ? false : "show"}
    >
      <MetricCard
        href="/learning"
        icon={<BoxIconLine className="text-fellowship-navy size-5" />}
        label="Modules complete"
        valueNode={
          <>
            <CountUp value={metrics.modulesComplete.value} /> /{" "}
            {metrics.modulesComplete.total}
          </>
        }
      />
      <MetricCard
        href="/my-sessions"
        icon={<CalenderIcon className="text-fellowship-navy size-5" />}
        label="Your attendance"
        valueNode={<CountUp value={metrics.attendanceRatePercent} suffix="%" />}
      />
      <MetricCard
        href="/ai-buddy"
        tourAnchor="ai-buddy"
        icon={<BoltIcon className="text-fellowship-navy size-5" />}
        label="AI Buddy Credit"
        valueNode={
          <>
            <CountUp value={metrics.aiBuddyRemaining.value} /> /{" "}
            {metrics.aiBuddyRemaining.dailyLimit}
          </>
        }
      />
      <MetricCard
        href="/my-capstone"
        icon={<CheckCircleIcon className="text-fellowship-navy size-5" />}
        label="Capstone"
        valueNode={<>{metrics.capstoneStatus}</>}
      />
    </motion.div>
  );
}

type CardProps = {
  icon: React.ReactNode;
  label: string;
  valueNode: React.ReactNode;
  hint?: string;
  tourAnchor?: string;
  href?: string;
};

function MetricCard({ icon, label, valueNode, hint, tourAnchor, href }: CardProps) {
  const reduce = useReducedMotion();
  const variants = reduce
    ? undefined
    : {
        hidden: { opacity: 0, y: 12 },
        show: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          },
        },
      };

  const card = (
    <motion.div
      data-tour={tourAnchor}
      variants={variants}
      whileHover={reduce ? undefined : { y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`rounded-2xl border border-gray-200 bg-white p-5 md:p-6 ${
        href ? "hover:border-fellowship-navy/30 transition-colors" : ""
      }`}
    >
      <div className="flex items-center justify-center w-10 h-10 bg-warning-100 rounded-xl">
        {icon}
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500">{label}</span>
        <h4 className="mt-2 font-bold text-gray-800 text-title-sm">
          {valueNode}
        </h4>
        {hint && <span className="text-xs text-gray-500">{hint}</span>}
      </div>
    </motion.div>
  );

  if (href) {
    return <Link href={href} className="block">{card}</Link>;
  }
  return card;
}
