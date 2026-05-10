import type { Metadata } from "next";
import SettingsView from "@/components/admin/settings/SettingsView";
import SettingsTour from "@/components/admin/tours/SettingsTour";
import { getSettingsServer } from "@/lib/api/settings.server";

export const metadata: Metadata = {
  title: "Settings · AI Fellows LMS",
  description:
    "Cohort details, registration controls, notifications, and programme defaults.",
};

export default async function SettingsPage() {
  const initial = await getSettingsServer();
  return (
    <>
      <SettingsTour />
      <SettingsView initial={initial} />
    </>
  );
}
