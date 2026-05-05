/**
 * Server-only notification fetcher (BRD §6.11). Maps backend
 * `LmsNotification` rows to the existing `AppNotification` shape the bell
 * dropdown renders. Returns `[]` when the backend is unreachable.
 */
import "server-only";
import { backendFetch } from "./backend";
import type {
  AppNotification,
  LmsNotification,
  LmsNotificationKind,
  NotificationType,
} from "./notifications";

export async function getNotificationsServer(): Promise<AppNotification[]> {
  try {
    const res = await backendFetch("/me/notifications", { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      notifications: LmsNotification[];
      unreadCount: number;
    };
    return (data.notifications ?? []).map(mapToAppNotification);
  } catch {
    return [];
  }
}

function mapToAppNotification(n: LmsNotification): AppNotification {
  return {
    id: n.id,
    type: mapKind(n.kind),
    title: n.title,
    body: n.body,
    actorName: null, // backend doesn't track originator name yet
    href: n.href ?? "/home",
    isRead: n.readAt !== null,
    createdAt: n.createdAt,
  };
}

function mapKind(kind: LmsNotificationKind): NotificationType {
  switch (kind) {
    case "attempt_submitted":
      return "assessment-pending";
    case "attempt_graded":
      // Closest legacy bucket — eventually we'd want a dedicated kind.
      return "assessment-pending";
    case "capstone_submitted":
      return "capstone-submitted";
    case "capstone_reviewed":
      return "capstone-submitted";
  }
}
