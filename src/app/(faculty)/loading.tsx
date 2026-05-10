import PageSkeleton from "@/components/ui/loader/PageSkeleton";

/**
 * Faculty route-segment loader. Faculty home + modules list both
 * use the dashboard shape; the modules list is close enough that
 * the content cards still feel right while paginated content
 * resolves.
 */
export default function FacultyLoading() {
  return <PageSkeleton variant="dashboard" />;
}
