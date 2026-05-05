import React from "react";
import Link from "next/link";
import {
 Table,
 TableBody,
 TableCell,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import { ChevronRightIcon } from "@/icons";
import type { AtRiskFellow } from "@/lib/api/dashboard";

type AtRiskFellowsProps = {
 fellows: AtRiskFellow[];
};

export default function AtRiskFellows({ fellows }: AtRiskFellowsProps) {
 return (
 <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
 <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
 <div>
 <h3 className="text-lg font-semibold text-gray-800">
 Fellows at risk
 </h3>
 <p className="mt-1 text-sm text-gray-500">
 Behind on attendance or progress — most actionable first.
 </p>
 </div>
 <Link
 href="/participants?filter=at-risk" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-fellowship-navy hover:text-fellowship-navy-dark">
 View all
 <ChevronRightIcon className="h-4 w-4"/>
 </Link>
 </div>

 <div className="mt-4 max-w-full overflow-x-auto">
 <Table>
 <TableHeader className="border-b border-gray-100">
 <TableRow>
 <TableCell
 isHeader
 className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
 Fellow
 </TableCell>
 <TableCell
 isHeader
 className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
 Attendance
 </TableCell>
 <TableCell
 isHeader
 className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
 Progress
 </TableCell>
 <TableCell
 isHeader
 className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
 Reason
 </TableCell>
 <TableCell
 isHeader
 className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">
 Last active
 </TableCell>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-gray-100">
 {fellows.map((f) => (
 <TableRow key={f.id} className="hover:bg-gray-50">
 <TableCell className="px-5 py-4 sm:px-6">
 <div className="flex items-center gap-3">
 <AvatarText name={f.fullName} className="h-9 w-9"/>
 <Link
 href={`/participants/${f.id}`}
 className="text-sm font-semibold text-gray-800 hover:text-fellowship-navy">
 {f.fullName}
 </Link>
 </div>
 </TableCell>
 <TableCell className="px-5 py-4">
 <Badge color={f.attendanceRate < 50 ?"error":"warning"}>
 {f.attendanceRate}%
 </Badge>
 </TableCell>
 <TableCell className="px-5 py-4">
 <Badge color={f.progressPercent < 45 ?"error":"warning"}>
 {f.progressPercent}%
 </Badge>
 </TableCell>
 <TableCell className="px-5 py-4 text-sm text-gray-600">
 {f.riskReason}
 </TableCell>
 <TableCell className="px-5 py-4 text-sm text-gray-500 sm:px-6">
 {relativeDays(f.lastActiveAt)}
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 </div>
 );
}

function relativeDays(iso: string): string {
 const then = new Date(iso).getTime();
 const now = Date.now();
 const days = Math.round((now - then) / 86_400_000);
 if (days <= 0) return "Today";
 if (days === 1) return "Yesterday";
 return `${days}d ago`;
}
