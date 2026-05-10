import PageSkeleton from "@/components/ui/loader/PageSkeleton";

/**
 * Mentor route-segment loader. The mentor home + queue both follow
 * the dashboard shape (heading, stats, content card pair).
 */
export default function MentorLoading() {
  return <PageSkeleton variant="dashboard" />;
}
