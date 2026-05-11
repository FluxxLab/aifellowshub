import LoadingRegion from "@/components/ui/loader/LoadingRegion";
import Skeleton from "@/components/ui/loader/Skeleton";
import { HeadingSkeleton } from "@/components/ui/loader/PageSkeleton";

/**
 * Admin settings — heading, then stacked form-shaped cards
 * (cohort, registration, notifications, defaults). Each card has
 * a title, a one-sentence description, and a labelled input grid.
 */
export default function SettingsLoading() {
  return (
    <LoadingRegion label="Loading settings…">
      <HeadingSkeleton titleWidth="w-32" subtitleWidth="w-[28rem]" />

      {Array.from({ length: 4 }).map((_, i) => (
        <SettingsCardSkeleton key={i} />
      ))}
    </LoadingRegion>
  );
}

function SettingsCardSkeleton() {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-1 h-3 w-3/5 max-w-md" />

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-end">
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </section>
  );
}
