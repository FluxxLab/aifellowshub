import type { Metadata } from "next";
import SettingsView from "@/components/admin/settings/SettingsView";
import { getSettingsServer } from "@/lib/api/settings.server";

export const metadata: Metadata = {
  title: "Settings · AI Fellows LMS",
  description:
    "Cohort details, registration controls, notifications, and programme defaults.",
};

export default async function SettingsPage() {
  const initial = await getSettingsServer();
  return <SettingsView initial={initial} />;
}
