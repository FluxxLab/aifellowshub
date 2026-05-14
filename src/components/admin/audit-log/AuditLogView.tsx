"use client";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import SelectField from "@/components/form/SelectField";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MobileRowCard, {
  MobileRowList,
} from "@/components/ui/table/MobileRowCard";
import type { AuditEntry } from "@/lib/api/audit-log.server";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";

type AuditLogViewProps = {
  rows: AuditEntry[];
  page: number;
  pageCount: number;
  total: number;
  filter: { action: string; actorId: string; targetUserId: string };
};

const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All actions" },
  { value: "auth.login", label: "Login" },
  { value: "auth.logout", label: "Logout" },
  { value: "auth.register", label: "Register" },
  { value: "auth.password_changed", label: "Password changed" },
  { value: "users.invited", label: "User invited" },
  { value: "capstone.approved", label: "Capstone approved" },
  { value: "capstone.returned", label: "Capstone returned" },
  { value: "capstone.reviewed", label: "Capstone reviewed" },
  { value: "certificate.issued", label: "Certificate issued" },
  { value: "certificate.revoked", label: "Certificate revoked" },
  { value: "module.published", label: "Module published" },
  { value: "module.returned", label: "Module returned" },
];

export default function AuditLogView({
  rows,
  page,
  pageCount,
  total,
  filter,
}: AuditLogViewProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [action, setAction] = useState(filter.action);
  const [actorId, setActorId] = useState(filter.actorId);
  const [targetUserId, setTargetUserId] = useState(filter.targetUserId);

  const applyFilters = () => {
    const q = new URLSearchParams();
    if (action) q.set("action", action);
    if (actorId.trim()) q.set("actorId", actorId.trim());
    if (targetUserId.trim()) q.set("targetUserId", targetUserId.trim());
    // Reset to page 1 on any filter change — landing on page 8 of a
    // freshly narrowed result set isn't useful.
    router.push(`/audit-log${q.toString() ? `?${q}` : ""}`);
  };

  const clearFilters = () => {
    setAction("");
    setActorId("");
    setTargetUserId("");
    router.push("/audit-log");
  };

  const goToPage = (target: number) => {
    if (target < 1 || target > pageCount) return;
    const q = new URLSearchParams(params?.toString() ?? "");
    if (target === 1) q.delete("page");
    else q.set("page", String(target));
    router.push(`/audit-log${q.toString() ? `?${q}` : ""}`);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <header>
        <h1 className="text-title-md font-bold text-gray-800">Audit log</h1>
        <p className="mt-1 text-sm text-gray-500">
          Append-only record of security-relevant events. Use it to investigate
          incidents and prove compliance.
        </p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <Label>Action</Label>
            <SelectField
              value={action}
              onChange={setAction}
              options={ACTION_OPTIONS}
            />
          </div>
          <div>
            <Label>Actor user ID</Label>
            <Input
              type="text"
              defaultValue={actorId}
              placeholder="cuid"
              onChange={(e) => setActorId(e.target.value)}
            />
          </div>
          <div>
            <Label>Target user ID</Label>
            <Input
              type="text"
              defaultValue={targetUserId}
              placeholder="cuid"
              onChange={(e) => setTargetUserId(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button size="sm" variant="fellowship" onClick={applyFilters}>
              Filter
            </Button>
            <Button size="sm" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </section>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          No events match the current filter.
        </div>
      ) : (
        <>
          <MobileRowList>
            {rows.map((e) => (
              <MobileRowCard
                key={e.id}
                header={
                  <div className="flex items-center gap-3">
                    {e.actor ? (
                      <AvatarText
                        name={e.actor.fullName}
                        className="h-9 w-9"
                      />
                    ) : (
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                        SYS
                      </span>
                    )}
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-gray-800">
                        {e.actor?.fullName ?? "System"}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {formatTime(e.createdAt)}
                      </span>
                    </div>
                  </div>
                }
                status={<ActionBadge action={e.action} />}
                meta={
                  <>
                    {e.targetUser && (
                      <span className="block text-xs text-gray-600">
                        Target: {e.targetUser.fullName}
                      </span>
                    )}
                    {e.targetType && e.targetId && (
                      <span className="block font-mono text-[10px] text-gray-500">
                        {e.targetType}:{shorten(e.targetId)}
                      </span>
                    )}
                  </>
                }
                stats={[
                  { label: "IP", value: e.ip ?? "—" },
                  {
                    label: "Detail",
                    value: e.metadata ? (
                      <code className="break-all text-[10px]">
                        {JSON.stringify(e.metadata)}
                      </code>
                    ) : (
                      "—"
                    ),
                  },
                ]}
              />
            ))}
          </MobileRowList>
          <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white md:block">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100">
                  <TableRow>
                    <Th>When</Th>
                    <Th>Action</Th>
                    <Th>Actor</Th>
                    <Th>Target</Th>
                    <Th>IP</Th>
                    <Th>Detail</Th>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100">
                  {rows.map((e) => (
                    <TableRow key={e.id} className="hover:bg-gray-50">
                      <Td>
                        <span className="text-sm text-gray-700">
                          {formatTime(e.createdAt)}
                        </span>
                      </Td>
                      <Td>
                        <ActionBadge action={e.action} />
                      </Td>
                      <Td>
                        {e.actor ? (
                          <div className="flex items-center gap-2">
                            <AvatarText
                              name={e.actor.fullName}
                              className="h-7 w-7 text-xs"
                            />
                            <div>
                              <span className="block text-sm font-medium text-gray-800">
                                {e.actor.fullName}
                              </span>
                              <span className="block text-xs text-gray-500">
                                {e.actor.role}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm italic text-gray-500">
                            System
                          </span>
                        )}
                      </Td>
                      <Td>
                        {e.targetUser ? (
                          <span className="text-sm text-gray-700">
                            {e.targetUser.fullName}
                          </span>
                        ) : e.targetType && e.targetId ? (
                          <span className="font-mono text-xs text-gray-500">
                            {e.targetType}:{shorten(e.targetId)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </Td>
                      <Td>
                        <span className="font-mono text-xs text-gray-600">
                          {e.ip ?? "—"}
                        </span>
                      </Td>
                      <Td>
                        {e.metadata ? (
                          <code className="block max-w-md break-all text-[10px] text-gray-600">
                            {JSON.stringify(e.metadata)}
                          </code>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </Td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {pageCount > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="text-xs text-gray-500">
            Showing page{" "}
            <span className="font-semibold text-gray-700">{page}</span> of{" "}
            <span className="font-semibold text-gray-700">{pageCount}</span>
            {" · "}
            <span className="font-semibold text-gray-700">{total}</span> total
            events
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
            >
              ‹ Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => goToPage(page + 1)}
              disabled={page >= pageCount}
            >
              Next ›
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <TableCell
      isHeader
      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 sm:px-6"
    >
      {children}
    </TableCell>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <TableCell className="px-5 py-4 sm:px-6">{children}</TableCell>;
}

function ActionBadge({ action }: { action: string }) {
  const colour: "info" | "success" | "warning" | "error" | "light" =
    action.startsWith("auth.")
      ? "info"
      : action.endsWith(".approved") || action.endsWith(".issued")
      ? "success"
      : action.endsWith(".returned") || action.endsWith(".revoked")
      ? "warning"
      : action === "auth.password_changed"
      ? "warning"
      : "light";
  return <Badge color={colour}>{action}</Badge>;
}

function formatTime(iso: string): string {
  // Locked to WAT (Africa/Lagos) so audit timestamps don't drift
  // when admins view from outside Nigeria. lib/datetime keeps the
  // full app's time display consistent.
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    timeZone: "Africa/Lagos",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shorten(id: string): string {
  return id.length > 10 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}
