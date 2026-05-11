import LoadingRegion from "@/components/ui/loader/LoadingRegion";
import Skeleton from "@/components/ui/loader/Skeleton";
import { HeadingSkeleton } from "@/components/ui/loader/PageSkeleton";

/**
 * Admin sessions shape — heading + Schedule CTA, view toggle
 * (calendar/list) + status filter row, then a calendar-grid OR
 * table area. We use the calendar shape since that's the default
 * view and the most distinctive: 6 rows × 7 columns of slots.
 */
export default function SessionsLoading() {
  return (
    <LoadingRegion label="Loading sessions…">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <HeadingSkeleton titleWidth="w-32" subtitleWidth="w-[28rem]" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      {/* Toolbar: view toggle + status filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Calendar grid — month view, 6 weeks × 7 days */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-gray-200">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className="aspect-square bg-white p-2">
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}
