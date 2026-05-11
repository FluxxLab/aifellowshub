import LoadingRegion from "@/components/ui/loader/LoadingRegion";
import Skeleton from "@/components/ui/loader/Skeleton";
import {
  ContentCardSkeleton,
  HeadingSkeleton,
} from "@/components/ui/loader/PageSkeleton";

/**
 * Capstone editor shape — heading, a status banner, then the
 * 2-up layout (wide draft form + narrow feedback / milestones
 * sidebar). The draft form is several stacked text-area cards
 * (problem statement, approach, stakeholders, deliverables).
 */
export default function MyCapstoneLoading() {
  return (
    <LoadingRegion label="Loading your capstone…">
      <HeadingSkeleton titleWidth="w-40" subtitleWidth="w-[36rem]" />

      {/* Status banner */}
      <Skeleton className="h-20 w-full rounded-2xl" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
        {/* Wide column — draft sections */}
        <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
          {/* Title card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-10 w-full" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>

          {/* 4 draft-section cards (problem / approach / stakeholders / deliverables) */}
          {Array.from({ length: 4 }).map((_, i) => (
            <DraftSectionSkeleton key={i} />
          ))}
        </div>

        {/* Narrow column — status, milestones, feedback */}
        <div className="flex flex-col gap-4 md:gap-6">
          <ContentCardSkeleton rows={3} />
          <ContentCardSkeleton rows={4} />
          <ContentCardSkeleton rows={2} />
        </div>
      </div>
    </LoadingRegion>
  );
}

function DraftSectionSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-1 h-3 w-72 max-w-full" />
      <Skeleton className="mt-4 h-32 w-full rounded-lg" />
    </div>
  );
}
