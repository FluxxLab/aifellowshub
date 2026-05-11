import LoadingRegion from "@/components/ui/loader/LoadingRegion";
import Skeleton from "@/components/ui/loader/Skeleton";
import { HeadingSkeleton } from "@/components/ui/loader/PageSkeleton";

/**
 * AI Buddy chat shape — heading on the left, quota chip on the right,
 * then a tall conversation panel with alternating bot/user bubbles
 * and a composer at the bottom. Matches `AiBuddyChat`'s exact layout
 * so the page doesn't pop when the real conversation hydrates.
 */
export default function AiBuddyLoading() {
  return (
    <LoadingRegion label="Loading AI Buddy…">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <HeadingSkeleton titleWidth="w-36" subtitleWidth="w-[28rem]" />
        <Skeleton className="h-7 w-32 rounded-full" />
      </div>

      <section className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {/* Header strip */}
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3">
          <Skeleton shape="circle" className="h-9 w-9" />
          <div className="flex flex-1 flex-col gap-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Conversation — greeting bot bubble + a couple of exchanges */}
        <div className="flex h-[480px] flex-col gap-4 px-5 py-5">
          <BubbleSkeleton side="left" widthClass="w-3/4" />
          <BubbleSkeleton side="right" widthClass="w-1/2" />
          <BubbleSkeleton side="left" widthClass="w-2/3" />
        </div>

        {/* Composer */}
        <div className="border-t border-gray-100 bg-white px-5 py-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-48 rounded-full" />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-11 flex-1" />
            <Skeleton className="h-11 w-11" />
          </div>
        </div>
      </section>
    </LoadingRegion>
  );
}

function BubbleSkeleton({
  side,
  widthClass,
}: {
  side: "left" | "right";
  widthClass: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 ${
        side === "right" ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <Skeleton shape="circle" className="h-9 w-9 shrink-0" />
      <Skeleton className={`h-16 ${widthClass} rounded-2xl`} />
    </div>
  );
}
