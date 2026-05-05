import React from "react";
import {
 Table,
 TableBody,
 TableCell,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import type { ModulePerformance } from "@/lib/api/analytics";

export default function ModulePerformanceTable({
 data,
 currentWeek,
}: {
 data: ModulePerformance[];
 currentWeek: number;
}) {
 return (
 <section className="rounded-2xl border border-gray-200 bg-white">
 <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
 <h2 className="text-base font-semibold text-gray-800">
 Module performance
 </h2>
 <p className="mt-1 text-sm text-gray-500">
 Attendance, assessment outcomes, and overall completion per module.
 </p>
 </div>
 <div className="max-w-full overflow-x-auto">
 <Table>
 <TableHeader className="border-b border-gray-100 bg-gray-50">
 <TableRow>
 <Th>Week</Th>
 <Th>Module</Th>
 <Th>Attendance</Th>
 <Th>Assessment pass</Th>
 <Th>Assessment avg</Th>
 <Th>Completion</Th>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-gray-100">
 {data.map((m) => {
 const isFuture = m.weekNumber > currentWeek;
 return (
 <TableRow
 key={m.weekNumber}
 className={isFuture ?"opacity-50":""}
 >
 <Td>
 <span className="text-xs font-semibold tabular-nums text-fellowship-navy">
 W{String(m.weekNumber).padStart(2,"0")}
 </span>
 </Td>
 <Td>
 <span className="text-sm font-medium text-gray-800">
 {m.moduleTitle}
 </span>
 </Td>
 <Td>
 {isFuture ? (
 <Dim>—</Dim>
 ) : (
 <Bar value={m.attendancePercent} />
 )}
 </Td>
 <Td>
 {m.assessmentPassPercent === null ? (
 <Dim>—</Dim>
 ) : (
 <Bar value={m.assessmentPassPercent} />
 )}
 </Td>
 <Td>
 {m.assessmentAvgScore === null ? (
 <Dim>—</Dim>
 ) : (
 <span className="text-sm tabular-nums text-gray-700">
 {m.assessmentAvgScore}%
 </span>
 )}
 </Td>
 <Td>
 {isFuture ? (
 <Dim>—</Dim>
 ) : (
 <Bar value={m.completionPercent} accent />
 )}
 </Td>
 </TableRow>
 );
 })}
 </TableBody>
 </Table>
 </div>
 </section>
 );
}

function Bar({ value, accent }: { value: number; accent?: boolean }) {
 return (
 <div className="flex items-center gap-3">
 <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
 <div
 className={`h-full rounded-full ${
 accent
 ?"bg-fellowship-navy":"bg-gray-400"}`}
 style={{ width:`${value}%`}}
 />
 </div>
 <span className="text-sm font-medium tabular-nums text-gray-700">
 {value}%
 </span>
 </div>
 );
}

function Dim({ children }: { children: React.ReactNode }) {
 return <span className="text-sm text-gray-300">{children}</span>;
}

function Th({ children }: { children: React.ReactNode }) {
 return (
 <TableCell
 isHeader
 className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 sm:px-6">
 {children}
 </TableCell>
 );
}

function Td({ children }: { children: React.ReactNode }) {
 return <TableCell className="px-5 py-4 sm:px-6">{children}</TableCell>;
}
