"use client";
import Link from "next/link";
import { ChevronLeftIcon } from "@/icons";

export default function ParticipantProfileError() {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/participants"
        className="inline-flex w-fit items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to participants
      </Link>
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-base font-semibold text-gray-700">
          Couldn&apos;t load this participant&apos;s profile.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          The profile may be incomplete or the backend returned an error. Try refreshing — if the problem persists, check Sentry for the server trace.
        </p>
      </div>
    </div>
  );
}
