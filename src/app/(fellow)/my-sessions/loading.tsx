import LoadingRegion from "@/components/ui/loader/LoadingRegion";
import Skeleton from "@/components/ui/loader/Skeleton";
import { HeadingSkeleton } from "@/components/ui/loader/PageSkeleton";

/**
 * Fellow sessions list shape — heading, a 4-stat strip
 * (total/attended/rate/upcoming), then alternating "live" and
 * "upcoming" section cards.
 */
export default function MySessionsLoading() {
  return (
    <LoadingRegion label="Loading your sessions…">
      <HeadingSkeleton titleWidth="w-44" subtitleWidth="w-[28rem]" />

      {/* Stats strip — 4 inline tiles */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming + past sections */}
      {Array.from({ length: 2 }).map((_, sectionIdx) => (
        <section key={sectionIdx}>
          <Skeleton className="mb-3 h-5 w-32" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SessionCardSkeleton key={i} />
            ))}
          </div>
        </section>
      ))}
    </LoadingRegion>
  );
}

function SessionCardSkeleton() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4 max-w-md" />
        <div className="mt-1 flex flex-wrap gap-3">
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <Skeleton className="h-9 w-28 rounded-lg" />
    </div>
  );
}
