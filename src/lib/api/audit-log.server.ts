/**
 * Server-only admin audit-log fetcher (security ops).
 * Maps the backend `/admin/audit-log` payload to the shape the admin page
 * renders. Returns an empty page envelope when the backend is unreachable.
 */
import "server-only";
import { backendFetch } from "./backend";

export type AuditEntry = {
  id: string;
  action: string;
  actor: { id: string; fullName: string; email: string; role: string } | null;
  targetUser: { id: string; fullName: string; email: string } | null;
  targetType: string | null;
  targetId: string | null;
  ip: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

type BackendResponse = {
  rows: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

const EMPTY: BackendResponse = {
  rows: [],
  total: 0,
  page: 1,
  pageSize: 25,
  pageCount: 1,
};

export async function getAuditLogServer(opts?: {
  action?: string;
  actorId?: string;
  targetUserId?: string;
  page?: number;
  pageSize?: number;
}): Promise<BackendResponse> {
  const params = new URLSearchParams();
  if (opts?.action) params.set("action", opts.action);
  if (opts?.actorId) params.set("actorId", opts.actorId);
  if (opts?.targetUserId) params.set("targetUserId", opts.targetUserId);
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.pageSize) params.set("pageSize", String(opts.pageSize));
  const query = params.toString();

  try {
    const res = await backendFetch(
      `/admin/audit-log${query ? `?${query}` : ""}`,
      { method: "GET" },
    );
    if (!res.ok) return EMPTY;
    return (await res.json()) as BackendResponse;
  } catch {
    return EMPTY;
  }
}
