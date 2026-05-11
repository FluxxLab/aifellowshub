import LoadingRegion from "@/components/ui/loader/LoadingRegion";
import Skeleton from "@/components/ui/loader/Skeleton";
import {
  HeadingSkeleton,
  TableRowSkeleton,
} from "@/components/ui/loader/PageSkeleton";

/**
 * Admin participants list shape — heading + invite button on the
 * right, tab bar (fellows/faculty/mentors/admins/waitlist), then
 * a row-based table. Mirrors ParticipantsList so the layout settles
 * in place.
 */
export default function ParticipantsLoading() {
  return (
    <LoadingRegion label="Loading participants…">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <HeadingSkeleton titleWidth="w-44" subtitleWidth="w-[28rem]" />
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28" />
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {Array.from({ length: 8 }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    </LoadingRegion>
  );
}
