import PageSkeleton from "@/components/ui/loader/PageSkeleton";

/**
 * Fellow route-segment loader.
 *
 * Renders inside the `(fellow)` layout's `<LayoutShell>` while a
 * server component (e.g. `getFellowHomeServer`) is in flight. Uses
 * the dashboard variant — most fellow pages (home, sessions, modules,
 * capstone) follow the same heading + 4-tile + 2-up shape.
 *
 * If a fellow page's loading shape is materially different (e.g. the
 * forum chat layout), drop a `loading.tsx` next to that page's
 * `page.tsx` — Next picks the closest one.
 */
export default function FellowLoading() {
  return <PageSkeleton variant="dashboard" />;
}
