"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";

/**
 * Shown when the sessions fetch fails (backend unreachable / transient
 * error after retries) instead of rendering a misleading short or empty
 * session list.
 *
 * Retry: `reset()` alone re-renders the boundary but does NOT re-fetch the
 * server component's data, so it would just throw again. `router.refresh()`
 * re-fetches; we run both in a transition so the recovered render shows.
 */
export default function SessionsError({ reset }: { error: Error; reset: () => void }) {
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
        We couldn&apos;t load your sessions
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm text-gray-600">
        This is usually a brief connection hiccup. Please try again in a
        moment.
      </p>
      <div className="mt-6">
        <Button size="md" variant="fellowship" onClick={retry} disabled={isPending}>
          {isPending ? "Retrying…" : "Try again"}
        </Button>
      </div>
    </div>
  );
}
