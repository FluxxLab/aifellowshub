"use client";
import Link from "next/link";
import { useState } from "react";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Button from "@/components/ui/button/Button";
import {
 BellIcon,
 CalenderIcon,
 CheckLineIcon,
 GroupIcon,
 TaskIcon,
} from "@/icons";
import { cn } from "@/lib/utils";
import {
 markAllNotificationsRead,
 markNotificationRead,
 type AppNotification,
 type NotificationType,
} from "@/lib/api/notifications";
import { toast } from "@/lib/toast";

type Bucket = { label: string; rows: AppNotification[] };

const DAY_MS = 24 * 60 * 60 * 1000;

function bucketise(rows: AppNotification[]): Bucket[] {
 const now = Date.now();
 const today: AppNotification[] = [];
 const yesterday: AppNotification[] = [];
 const earlier: AppNotification[] = [];
 for (const n of rows) {
 const age = now - new Date(n.createdAt).getTime();
 if (age < DAY_MS) today.push(n);
 else if (age < DAY_MS * 2) yesterday.push(n);
 else earlier.push(n);
 }
 const out: Bucket[] = [];
 if (today.length) out.push({ label: "Today", rows: today });
 if (yesterday.length) out.push({ label: "Yesterday", rows: yesterday });
 if (earlier.length) out.push({ label: "Earlier", rows: earlier });
 return out;
}

export default function NotificationsView({
 initial,
}: {
 initial: AppNotification[];
}) {
 const [rows, setRows] = useState<AppNotification[]>(initial);
 const [busy, setBusy] = useState(false);
 const unreadCount = rows.filter((n) => !n.isRead).length;
 const buckets = bucketise(rows);

 const onMarkAllRead = async () => {
 if (busy || unreadCount === 0) return;
 const snapshot = rows;
 setBusy(true);
 setRows((prev) => prev.map((n) => ({ ...n, isRead: true })));
 try {
 await markAllNotificationsRead();
 toast.success("All notifications marked as read.");
 } catch (err) {
 setRows(snapshot);
 toast.errorFromException("Couldn't mark all read", err);
 } finally {
 setBusy(false);
 }
 };

 const markOne = async (id: string) => {
 setRows((prev) =>
 prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
 );
 try {
 await markNotificationRead(id);
 } catch {
 // Optimistic update sticks; next refresh will reconcile.
 }
 };

 if (rows.length === 0) {
 return (
 <section className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
 <BellIcon className="mx-auto h-10 w-10 text-gray-300" />
 <p className="mt-3 text-base font-medium text-gray-700">
 You&apos;re all caught up
 </p>
 <p className="mt-1 text-sm text-gray-500">
 New activity will appear here as it happens.
 </p>
 </section>
 );
 }

 return (
 <section className="rounded-2xl border border-gray-200 bg-white">
 <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 md:px-6">
 <div className="flex items-baseline gap-2">
 <h2 className="text-base font-semibold text-gray-800">
 {rows.length} notification{rows.length === 1 ? "" : "s"}
 </h2>
 {unreadCount > 0 && (
 <span className="text-xs font-medium text-gray-500">
 · {unreadCount} unread
 </span>
 )}
 </div>
 {unreadCount > 0 && (
 <Button
 size="sm"
 variant="outline"
 onClick={onMarkAllRead}
 disabled={busy}
 >
 <CheckLineIcon className="h-4 w-4" />
 Mark all read
 </Button>
 )}
 </header>

 <div className="flex flex-col">
 {buckets.map((b) => (
 <div key={b.label}>
 <div className="bg-gray-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 md:px-6">
 {b.label}
 </div>
 <ul>
 {b.rows.map((n) => (
 <Row key={n.id} n={n} onClick={() => markOne(n.id)} />
 ))}
 </ul>
 </div>
 ))}
 </div>
 </section>
 );
}

function Row({
 n,
 onClick,
}: {
 n: AppNotification;
 onClick: () => void;
}) {
 return (
 <li
 className={cn(
 "border-b border-gray-100 last:border-b-0",
 !n.isRead && "bg-fellowship-navy/5",
 )}
 >
 <Link
 href={n.href}
 onClick={onClick}
 className="flex gap-3 px-5 py-4 transition-colors hover:bg-gray-50 md:px-6"
 >
 <ActorIcon notification={n} />
 <div className="min-w-0 flex-1">
 <p className="text-sm font-semibold text-gray-800">{n.title}</p>
 <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
 {n.body}
 </p>
 <p className="mt-1.5 text-xs text-gray-400">
 {relativeTime(n.createdAt)}
 </p>
 </div>
 {!n.isRead && (
 <span
 aria-hidden
 className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warning-400"
 />
 )}
 </Link>
 </li>
 );
}

function ActorIcon({ notification: n }: { notification: AppNotification }) {
 if (n.actorName) {
 return <AvatarText name={n.actorName} className="h-9 w-9 text-xs" />;
 }
 return (
 <div
 className={cn(
 "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
 bgForType(n.type),
 )}
 >
 <IconForType type={n.type} />
 </div>
 );
}

function bgForType(type: NotificationType): string {
 switch (type) {
 case "fellow-at-risk":
 case "capstone-overdue":
 return "bg-error-100 text-error-600";
 case "assessment-pending":
 return "bg-warning-100 text-warning-700";
 case "session-reminder":
 return "bg-blue-light-100 text-blue-light-700";
 case "waitlist-joined":
 case "application-received":
 return "bg-brand-100 text-brand-700";
 default:
 return "bg-gray-100 text-gray-600";
 }
}

function IconForType({ type }: { type: NotificationType }) {
 if (type === "session-reminder") return <CalenderIcon className="h-5 w-5" />;
 if (type === "fellow-at-risk" || type === "waitlist-joined")
 return <GroupIcon className="h-5 w-5" />;
 if (type === "assessment-pending") return <TaskIcon className="h-5 w-5" />;
 return <BellIcon className="h-5 w-5" />;
}

function relativeTime(iso: string): string {
 const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
 if (seconds < 60) return "just now";
 const minutes = Math.round(seconds / 60);
 if (minutes < 60) return `${minutes} min ago`;
 const hours = Math.round(minutes / 60);
 if (hours < 24) return `${hours} hr ago`;
 const days = Math.round(hours / 24);
 if (days === 1) return "yesterday";
 return `${days}d ago`;
}
