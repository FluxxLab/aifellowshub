"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";

/**
 * Shown when the curriculum fetch fails (backend unreachable / transient
 * error after retries). Distinct from the "no modules published yet" empty
 * state — that means the cohort genuinely has no modules; this means we
 * couldn't load them.
 *
 * Retry: `reset()` on its own only re-renders the error boundary — it does
 * NOT re-run the server component's data fetch, so on a still-failing (or
 * just-recovered) backend it immediately throws again and the button looks
 * dead. `router.refresh()` is what actually re-fetches the server data; we
 * pair the two inside a transition so the fresh render replaces the error.
 */
export default function LearningError({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const retry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-medium text-gray-500">Couldn&apos;t load</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-800">
        We couldn&apos;t load your modules
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm text-gray-600">
        This is usually a brief connection hiccup. Your progress is safe —
        please try again in a moment.
      </p>
      <div className="mt-6">
        <Button size="md" variant="fellowship" onClick={retry} disabled={isPending}>
          {isPending ? "Retrying…" : "Try again"}
        </Button>
      </div>
    </div>
  );
}
