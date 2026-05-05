import type { Metadata } from "next";
import HeroMetrics from "@/components/admin/dashboard/HeroMetrics";
import CohortProgressChart from "@/components/admin/dashboard/CohortProgressChart";
import UpcomingSessions from "@/components/admin/dashboard/UpcomingSessions";
import WelcomePanel from "@/components/admin/dashboard/WelcomePanel";
import ModuleCompletionChart from "@/components/admin/dashboard/ModuleCompletionChart";
import EngagementTrendChart from "@/components/admin/dashboard/EngagementTrendChart";
import CohortCompositionDonut from "@/components/admin/dashboard/CohortCompositionDonut";
import AtRiskFellows from "@/components/admin/dashboard/AtRiskFellows";
import AdminFirstLoginTour from "@/components/admin/dashboard/AdminFirstLoginTour";
import { getDashboardSummaryServer } from "@/lib/api/dashboard.server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

export const metadata: Metadata = {
  title: "Dashboard · AI Fellows LMS",
  description:
    "Programme health at a glance — fellow progress, attendance, capstones, and upcoming sessions.",
};

export default async function DashboardPage() {
  const [summary, user] = await Promise.all([
    getDashboardSummaryServer(),
    getCurrentUser(),
  ]);

  const showAdminTour =
    !user.hasSeenTour &&
    (user.role === "admin" || user.role === "super_admin");
  const firstName = user.fullName.split(" ")[0];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {showAdminTour && <AdminFirstLoginTour firstName={firstName} />}
      <WelcomePanel
        user={user}
        cohortName={summary.cohort.name}
        currentWeek={summary.cohort.currentWeek}
        attentionItems={summary.attentionItems}
      />

      <HeroMetrics metrics={summary.metrics} />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div data-tour="cohort-progress" className="col-span-12 xl:col-span-8">
          <CohortProgressChart
            cohortName={summary.cohort.name}
            data={summary.cohortProgress}
          />
        </div>
        <div data-tour="upcoming-sessions" className="col-span-12 xl:col-span-4">
          <UpcomingSessions sessions={summary.upcomingSessions} />
        </div>
      </div>

      <ModuleCompletionChart data={summary.moduleCompletion} />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-8">
          <EngagementTrendChart data={summary.engagementTrend} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <CohortCompositionDonut data={summary.cohortBySector} />
        </div>
      </div>

      <div data-tour="at-risk">
        <AtRiskFellows fellows={summary.atRiskFellows} />
      </div>
    </div>
  );
}
