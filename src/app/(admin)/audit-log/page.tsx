import type { Metadata } from "next";
import AuditLogView from "@/components/admin/audit-log/AuditLogView";
import { getAuditLogServer } from "@/lib/api/audit-log.server";

export const metadata: Metadata = {
  title: "Audit log · AI Fellows LMS",
  description:
    "Append-only security event trail for incident response and compliance.",
};

type PageProps = {
  searchParams: Promise<{
    action?: string;
    actorId?: string;
    targetUserId?: string;
    cursor?: string;
  }>;
};

export default async function AuditLogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getAuditLogServer({
    action: params.action,
    actorId: params.actorId,
    targetUserId: params.targetUserId,
    cursor: params.cursor,
    limit: 50,
  });
  return (
    <AuditLogView
      items={data.items}
      nextCursor={data.nextCursor}
      filter={{
        action: params.action ?? "",
        actorId: params.actorId ?? "",
        targetUserId: params.targetUserId ?? "",
      }}
    />
  );
}
