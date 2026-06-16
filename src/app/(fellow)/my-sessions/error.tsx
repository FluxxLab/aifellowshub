"use client";
import Button from "@/components/ui/button/Button";
import { useErrorRetry } from "@/lib/hooks/useErrorRetry";

/**
 * Shown when the sessions fetch fails (backend unreachable / transient error
 * after retries) instead of a misleading short or empty session list.
 * Auto-retries with backoff, then falls back to a manual button.
 */
export default function SessionsError({ reset }: { error: Error; reset: () => void }) {
  const { isPending, autoExhausted, manualRetry } = useErrorRetry(reset, "my-sessions");

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-medium text-gray-500">Couldn&apos;t load</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-800">
        We couldn&apos;t load your sessions
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm text-gray-600">
        {autoExhausted
          ? "Still no luck reaching the server. Check your connection and try again."
          : "This is usually a brief connection hiccup. Reconnecting automatically…"}
      </p>
      <div className="mt-6">
        <Button
          size="md"
          variant="fellowship"
          onClick={manualRetry}
          disabled={isPending}
        >
          {isPending ? "Retrying…" : autoExhausted ? "Try again" : "Retry now"}
        </Button>
      </div>
    </div>
  );
}
