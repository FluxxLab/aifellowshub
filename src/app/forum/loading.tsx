import LoadingRegion from "@/components/ui/loader/LoadingRegion";
import Skeleton from "@/components/ui/loader/Skeleton";
import {
  HeadingSkeleton,
} from "@/components/ui/loader/PageSkeleton";

/**
 * /forum has a distinctive two-column layout (group list sidebar +
 * chat panel) that none of the generic PageSkeleton variants match.
 * Mirroring it specifically — left column is the channel list, right
 * column shows alternating message bubbles aligned for "mine" vs
 * "theirs" — so the layout settles in place when ForumChat hydrates.
 */
export default function ForumLoading() {
  return (
    <LoadingRegion label="Loading forum…">
      <HeadingSkeleton titleWidth="w-32" subtitleWidth="w-80" />

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar — group list */}
        <aside className="rounded-2xl border border-gray-200 bg-white p-3">
          <Skeleton className="mx-2 my-2 h-3 w-16" />
          <div className="flex flex-col gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        </aside>

        {/* Right panel — header + messages + composer */}
        <section className="flex h-[70vh] flex-col rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-3">
            <Skeleton shape="circle" className="h-9 w-9" />
            <Skeleton className="h-4 w-36" />
          </div>

          <div className="flex flex-1 flex-col gap-4 overflow-hidden px-5 py-5">
            {/* Three "theirs" bubbles + one "mine" so the new chat-bubble
             *  styling settles into place without a layout pop. */}
            <BubbleSkeleton side="left" />
            <BubbleSkeleton side="left" widthClass="w-2/3" />
            <BubbleSkeleton side="right" widthClass="w-1/2" />
            <BubbleSkeleton side="left" widthClass="w-3/4" />
            <BubbleSkeleton side="right" widthClass="w-1/3" />
          </div>

          <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-20" />
          </div>
        </section>
      </div>
    </LoadingRegion>
  );
}

function BubbleSkeleton({
  side,
  widthClass = "w-3/5",
}: {
  side: "left" | "right";
  widthClass?: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 ${
        side === "right" ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <Skeleton shape="circle" className="h-9 w-9 shrink-0" />
      <div className="flex max-w-[80%] flex-col gap-1">
        <Skeleton className="h-3 w-32" />
        <Skeleton className={`h-10 ${widthClass} rounded-2xl`} />
      </div>
    </div>
  );
}
