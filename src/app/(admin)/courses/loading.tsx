import LoadingRegion from "@/components/ui/loader/LoadingRegion";
import Skeleton from "@/components/ui/loader/Skeleton";
import { HeadingSkeleton } from "@/components/ui/loader/PageSkeleton";

/**
 * Admin courses page — heading + "New course" CTA, then a stack of
 * course cards (each showing title + summary + 12 module pills + a
 * count badge). Card-list shape, not a table.
 */
export default function CoursesLoading() {
  return (
    <LoadingRegion label="Loading courses…">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <HeadingSkeleton titleWidth="w-36" subtitleWidth="w-[28rem]" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      <div className="flex flex-col gap-4 md:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </LoadingRegion>
  );
}

function CourseCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-2/5 max-w-md" />
          <Skeleton className="h-3 w-4/5 max-w-2xl" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
    </div>
  );
}
