/**
 * Notifications — bell + inbox (BRD §6.11).
 *
 * The legacy `AppNotification` shape powers the existing dropdown UI; the
 * `LmsNotification` shape mirrors the backend (`/me/notifications`). The
 * dropdown's server fetcher maps backend → AppNotification so the existing
 * UI keeps working without a rewrite.
 */
import { apiFetch } from "./client";

/* ---------- Real backend shape ---------- */

export type LmsNotificationKind =
  | "attempt_submitted"
  | "attempt_graded"
  | "capstone_submitted"
  | "capstone_reviewed";

export type LmsNotification = {
  id: string;
  kind: LmsNotificationKind;
  title: string;
  body: string;
  href: string | null;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsListResponse = {
  notifications: LmsNotification[];
  unreadCount: number;
};

export async function listNotifications(opts: { unreadOnly?: boolean } = {}) {
  const qs = opts.unreadOnly ? "?unread=1" : "";
  return apiFetch<NotificationsListResponse>(`/me/notifications${qs}`);
}

export async function markNotificationRead(id: string) {
  return apiFetch<{ notification: LmsNotification }>(
    `/notifications/${encodeURIComponent(id)}/read`,
    { method: "POST" },
  );
}

export async function markAllNotificationsRead() {
  return apiFetch<{ updated: number }>("/me/notifications/read-all", {
    method: "POST",
  });
}

/* ---------- Legacy shape consumed by the dropdown UI ---------- */

export type NotificationType =
  | "session-reminder"
  | "capstone-submitted"
  | "capstone-overdue"
  | "fellow-at-risk"
  | "application-received"
  | "assessment-pending"
  | "waitlist-joined"
  | "certificate-issued"
  | "forum-mention";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  /** Inline body — short. Long-form lives on the destination page. */
  body: string;
  /** Optional actor (fellow / mentor) for avatar + attribution. */
  actorName: string | null;
  /** Where clicking the notification takes the user. */
  href: string;
  isRead: boolean;
  createdAt: string;
};

function mapKindToType(kind: LmsNotificationKind): NotificationType {
  switch (kind) {
    case "attempt_submitted":
      return "assessment-pending";
    case "attempt_graded":
      return "assessment-pending";
    case "capstone_submitted":
      return "capstone-submitted";
    case "capstone_reviewed":
      return "capstone-submitted";
  }
}

/** Bell-dropdown loader. Returns an empty list when the backend is unreachable. */
export async function getNotifications(): Promise<AppNotification[]> {
  try {
    const data = await listNotifications();
    return (data.notifications ?? []).map((n) => ({
      id: n.id,
      type: mapKindToType(n.kind),
      title: n.title,
      body: n.body,
      actorName: null,
      href: n.href ?? "/home",
      isRead: n.readAt !== null,
      createdAt: n.createdAt,
    }));
  } catch {
    return [];
  }
}
