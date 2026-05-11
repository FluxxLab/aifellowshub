import LoadingRegion from "@/components/ui/loader/LoadingRegion";
import Skeleton from "@/components/ui/loader/Skeleton";
import { HeadingSkeleton } from "@/components/ui/loader/PageSkeleton";

/**
 * Curriculum view shape — heading, a wide progress card, then a stack
 * of week-cards. Each week-card has a status orb, a title/summary,
 * and two path chips (live session + assessment). Mirrors
 * `(fellow)/learning/page.tsx` so the page settles instead of jumping.
 */
export default function LearningLoading() {
  return (
    <LoadingRegion label="Loading curriculum…">
      <HeadingSkeleton titleWidth="w-48" subtitleWidth="w-[28rem]" />

      {/* Progress card */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-72 max-w-full" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-2 w-full rounded-full" />
      </section>

      {/* Week cards */}
      <ol className="flex flex-col gap-3 md:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i}>
            <ModuleRowSkeleton />
          </li>
        ))}
      </ol>
    </LoadingRegion>
  );
}

function ModuleRowSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex items-start gap-4">
        <Skeleton shape="circle" className="h-10 w-10 shrink-0" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-3/5 max-w-full" />
          <Skeleton className="h-3 w-4/5 max-w-full" />
          <div className="mt-2 flex flex-wrap gap-2">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
        </div>
        <Skeleton className="hidden h-9 w-24 rounded-lg md:block" />
      </div>
    </div>
  );
}
