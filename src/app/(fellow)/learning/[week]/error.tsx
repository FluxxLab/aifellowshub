"use client";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { useErrorRetry } from "@/lib/hooks/useErrorRetry";

export default function ModuleError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const { isPending, autoExhausted, manualRetry } = useErrorRetry(reset, "module");

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-medium text-gray-500">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-800">
        Couldn&apos;t load this module
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm text-gray-600">
        {autoExhausted
          ? "Still couldn't reach the server. Your progress is safe — check your connection and try again."
          : "There was a problem reaching the server. Reconnecting automatically…"}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button size="md" variant="fellowship" onClick={manualRetry} disabled={isPending}>
          {isPending ? "Retrying…" : autoExhausted ? "Try again" : "Retry now"}
        </Button>
        <Link href="/learning">
          <Button size="md" variant="outline">
            Back to modules
          </Button>
        </Link>
      </div>
    </div>
  );
}
