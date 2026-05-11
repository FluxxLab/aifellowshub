import LoadingRegion from "@/components/ui/loader/LoadingRegion";
import Skeleton from "@/components/ui/loader/Skeleton";
import {
  ContentCardSkeleton,
  HeadingSkeleton,
  StatTilesRowSkeleton,
} from "@/components/ui/loader/PageSkeleton";

/**
 * Admin dashboard — heading welcome block, 4-tile hero metrics
 * (active fellows / avg progress / attendance / capstones), then
 * the 2-up charts row (cohort progress + upcoming sessions), the
 * module-completion chart, the engagement-trend + cohort donut
 * row, and finally the at-risk fellows card.
 */
export default function DashboardLoading() {
  return (
    <LoadingRegion label="Loading dashboard…">
      {/* Welcome panel + attention items */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <HeadingSkeleton titleWidth="w-64" subtitleWidth="w-[28rem]" />
        <div className="mt-4 flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-40 rounded-full" />
          ))}
        </div>
      </div>

      <StatTilesRowSkeleton />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Cohort progress chart — wide */}
        <div className="col-span-12 xl:col-span-8">
          <ChartCardSkeleton height="h-72" />
        </div>
        {/* Upcoming sessions — narrow */}
        <div className="col-span-12 xl:col-span-4">
          <ContentCardSkeleton rows={4} />
        </div>
      </div>

      <ChartCardSkeleton height="h-64" />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-8">
          <ChartCardSkeleton height="h-64" />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <ChartCardSkeleton height="h-64" />
        </div>
      </div>

      <ContentCardSkeleton rows={4} />
    </LoadingRegion>
  );
}

function ChartCardSkeleton({ height }: { height: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className={`mt-4 ${height} w-full`} />
    </div>
  );
}
