import type { Metadata } from "next";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import NotificationsView from "@/components/notifications/NotificationsView";
import { getNotificationsServer } from "@/lib/api/notifications.server";

export const metadata: Metadata = {
 title: "Notifications · AI Fellows LMS",
 description:
 "Everything that happened across your fellowship surfaces (BRD §6.11).",
};

export default async function NotificationsPage() {
 const notifications = await getNotificationsServer();
 return (
 <div className="flex flex-col gap-4 md:gap-6">
 <Breadcrumbs items={[{ label: "Notifications" }]} />
 <div>
 <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
 Notifications
 </h1>
 <p className="mt-2 text-gray-600">
 New activity across your fellowship surfaces, newest first.
 </p>
 </div>
 <NotificationsView initial={notifications} />
 </div>
 );
}
