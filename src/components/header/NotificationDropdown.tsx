"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import AvatarText from "../ui/avatar/AvatarText";
import { BellIcon, CalenderIcon, GroupIcon, TaskIcon } from "@/icons";
import { cn } from "@/lib/utils";
import {
 getNotifications,
 markAllNotificationsRead,
 markNotificationRead,
 type AppNotification,
 type NotificationType,
} from "@/lib/api/notifications";

export default function NotificationDropdown() {
 const [notifications, setNotifications] = useState<AppNotification[]>([]);
 const [isOpen, setIsOpen] = useState(false);

 useEffect(() => {
 let alive = true;
 getNotifications().then((n) => {
 if (alive) setNotifications(n);
 });
 return () => {
 alive = false;
 };
 }, []);

 const unread = notifications.filter((n) => !n.isRead);
 const hasUnread = unread.length > 0;

 const markAllRead = async () => {
 setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
 try {
 await markAllNotificationsRead();
 } catch {
 // Optimistic update stays — next poll will reconcile.
 }
 };

 const markOneRead = async (id: string) => {
 setNotifications((prev) =>
 prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
 );
 try {
 await markNotificationRead(id);
 } catch {
 // ignore
 }
 };

 return (
 <div className="relative">
 <button
 type="button" aria-label={
 hasUnread ?`${unread.length} unread notifications`:"Notifications"}
 aria-haspopup="menu" aria-expanded={isOpen}
 onClick={() => setIsOpen((v) => !v)}
 className="dropdown-toggle relative flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900">
 {hasUnread && (
 <span className="absolute right-1.5 top-1.5 z-10 flex h-2 w-2">
 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning-400 opacity-75"/>
 <span className="relative inline-flex h-2 w-2 rounded-full bg-warning-400"/>
 </span>
 )}
 <BellIcon className="h-5 w-5"/>
 </button>

 <Dropdown
 isOpen={isOpen}
 onClose={() => setIsOpen(false)}
 className="absolute right-0 mt-3 flex max-h-[80vh] w-[360px] flex-col rounded-2xl border border-gray-200 bg-white shadow-theme-lg">
 <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
 <div className="flex items-baseline gap-2">
 <h5 className="text-base font-semibold text-gray-800">
 Notifications
 </h5>
 {hasUnread && (
 <span className="text-xs font-medium text-gray-500">
 {unread.length} unread
 </span>
 )}
 </div>
 {hasUnread && (
 <button
 type="button" onClick={markAllRead}
 className="text-xs font-semibold text-fellowship-navy hover:text-fellowship-navy-dark">
 Mark all read
 </button>
 )}
 </header>

 <ul className="flex flex-1 flex-col overflow-y-auto custom-scrollbar">
 {notifications.length === 0 ? (
 <li className="px-6 py-12 text-center text-sm text-gray-500">
 You&apos;re all caught up.
 </li>
 ) : (
 notifications.map((n) => (
 <NotificationRow
 key={n.id}
 notification={n}
 onClick={() => {
 markOneRead(n.id);
 setIsOpen(false);
 }}
 />
 ))
 )}
 </ul>

 <footer className="border-t border-gray-100 p-2">
 <Link
 href="/notifications" onClick={() => setIsOpen(false)}
 className="block rounded-lg px-3 py-2 text-center text-sm font-semibold text-fellowship-navy hover:bg-gray-100">
 View all notifications
 </Link>
 </footer>
 </Dropdown>
 </div>
 );
}

function NotificationRow({
 notification: n,
 onClick,
}: {
 notification: AppNotification;
 onClick: () => void;
}) {
 return (
 <li
 className={cn("border-b border-gray-100 last:border-b-0",
 !n.isRead &&"bg-fellowship-navy/5")}
 >
 <Link
 href={n.href}
 onClick={onClick}
 className="flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50">
 <ActorIcon notification={n} />
 <div className="min-w-0 flex-1">
 <p className="text-sm font-semibold text-gray-800">
 {n.title}
 </p>
 <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
 {n.body}
 </p>
 <p className="mt-1.5 text-xs text-gray-400">
 {relativeTime(n.createdAt)}
 </p>
 </div>
 {!n.isRead && (
 <span
 aria-hidden
 className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-warning-400"/>
 )}
 </Link>
 </li>
 );
}

function ActorIcon({ notification: n }: { notification: AppNotification }) {
 if (n.actorName) {
 return <AvatarText name={n.actorName} className="h-9 w-9 text-xs"/>;
 }
 return (
 <div
 className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
 bgForType(n.type)
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
 if (type ==="session-reminder") return <CalenderIcon className="h-5 w-5"/>;
 if (type ==="fellow-at-risk"|| type ==="waitlist-joined")
 return <GroupIcon className="h-5 w-5"/>;
 if (type ==="assessment-pending") return <TaskIcon className="h-5 w-5"/>;
 return <BellIcon className="h-5 w-5"/>;
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
