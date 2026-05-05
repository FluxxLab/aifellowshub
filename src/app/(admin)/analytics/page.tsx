import type { Metadata } from "next";
import AnalyticsView from "@/components/admin/analytics/AnalyticsView";
import { getAnalyticsSummaryServer } from "@/lib/api/analytics.server";

export const metadata: Metadata = {
  title: "Analytics · AI Fellows LMS",
  description:
    "Cohort and per-fellow analytics with CSV export (BRD §6.12).",
};

export default async function AnalyticsPage() {
  const summary = await getAnalyticsSummaryServer();
  return <AnalyticsView summary={summary} />;
}
