import PageSkeleton from "@/components/ui/loader/PageSkeleton";

/**
 * Admin route-segment loader. Dashboard variant covers /dashboard,
 * /participants, /courses, /sessions, /capstone, /certificates, and
 * /settings. List-heavy pages (audit-log, mentorship-bookings) get
 * close enough — a per-page override is cheap if a specific page
 * benefits from a list-shaped skeleton.
 */
export default function AdminLoading() {
  return <PageSkeleton variant="dashboard" />;
}
