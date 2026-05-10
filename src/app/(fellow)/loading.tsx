import LoadingScreen from "@/components/ui/loader/LoadingScreen";

/**
 * Fellow route-segment loader. Renders inside the `(fellow)` layout's
 * `<LayoutShell>` while a server component (e.g. the home page's
 * `getFellowHomeServer` aggregator) is in flight. The shell — sidebar,
 * top nav — stays visible so the user keeps their bearings.
 */
export default function FellowLoading() {
  return <LoadingScreen label="Loading…" />;
}
