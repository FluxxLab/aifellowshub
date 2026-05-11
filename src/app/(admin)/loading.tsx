import PageSkeleton from "@/components/ui/loader/PageSkeleton";

/**
 * Admin route-segment loader. Catch-all for the admin pages that
 * don't have a bespoke `loading.tsx` of their own (audit-log,
 * forum-groups, mentorship-bookings, certificates, capstone, etc.) —
 * those are list-shaped. Pages with dedicated loaders (dashboard,
 * participants, courses, sessions, settings) override this.
 */
export default function AdminLoading() {
  return <PageSkeleton variant="list" />;
}
