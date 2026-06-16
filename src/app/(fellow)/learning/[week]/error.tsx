"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/button/Button";

export default function ModuleError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // reset() alone re-renders the boundary but doesn't re-run the server
  // component's data fetch — pair it with router.refresh() so a recovered
  // backend actually reloads instead of throwing again.
  const retry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-medium text-gray-500">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-800">
        Couldn&apos;t load this module
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm text-gray-600">
        There was a problem reaching the server. Your progress is safe — please
        try again in a moment.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button size="md" variant="fellowship" onClick={retry} disabled={isPending}>
          {isPending ? "Retrying…" : "Try again"}
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
