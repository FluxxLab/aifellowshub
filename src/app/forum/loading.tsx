import PageSkeleton from "@/components/ui/loader/PageSkeleton";

/**
 * /forum lives outside (fellow) so its own loader is needed —
 * the role-group loaders don't cover this segment any more.
 */
export default function ForumLoading() {
  return <PageSkeleton variant="list" label="Loading forum…" />;
}
