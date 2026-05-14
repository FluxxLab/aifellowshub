import type { Metadata } from "next";
import AuditLogView from "@/components/admin/audit-log/AuditLogView";
import { getAuditLogServer } from "@/lib/api/audit-log.server";

export const metadata: Metadata = {
  title: "Audit log · AI Fellows LMS",
  description:
    "Append-only security event trail for incident response and compliance.",
};

type PageProps = {
  searchParams: {
    action?: string;
    actorId?: string;
    targetUserId?: string;
    page?: string;
  };
};

export default async function AuditLogPage({ searchParams }: PageProps) {
  const params = searchParams;
  const pageNum = Number(params.page);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
  const data = await getAuditLogServer({
    action: params.action,
    actorId: params.actorId,
    targetUserId: params.targetUserId,
    page,
    pageSize: 50,
  });
  return (
    <AuditLogView
      rows={data.rows}
      page={data.page}
      pageCount={data.pageCount}
      total={data.total}
      filter={{
        action: params.action ?? "",
        actorId: params.actorId ?? "",
        targetUserId: params.targetUserId ?? "",
      }}
    />
  );
}
