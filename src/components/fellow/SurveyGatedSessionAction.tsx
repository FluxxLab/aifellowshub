"use client";
import { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import LiveSessionAction from "@/components/fellow/LiveSessionAction";
import { LockIcon } from "@/icons";
import type { ModuleSession } from "@/lib/api/fellow-learning";

const STORAGE_KEY = "pic_lms_pre_fellowship_survey_v1";

/**
 * Wraps LiveSessionAction for Week 1. Checks whether the fellow has
 * submitted the pre-fellowship survey (localStorage). If not, the
 * Register / Join button is replaced with a locked state that links
 * back to the survey card above. Ended / cancelled sessions are
 * never gated — there's nothing actionable to block.
 */
export default function SurveyGatedSessionAction({
  session,
}: {
  session: ModuleSession;
}) {
  const [surveyed, setSurveyed] = useState<boolean | null>(null);

  useEffect(() => {
    setSurveyed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  // Avoid layout shift before localStorage is read.
  if (surveyed === null) return null;

  // Survey done — normal flow.
  if (surveyed) return <LiveSessionAction session={session} />;

  // Nothing to gate for sessions that are already over.
  if (session.status === "ended" || session.status === "cancelled") {
    return <LiveSessionAction session={session} />;
  }

  const actionLabel = session.status === "live" ? "Join session" : "Register";

  return (
    <div className="flex flex-col gap-2">
      <Button size="sm" variant="outline" className="w-full" disabled>
        <LockIcon className="mr-1.5 h-3.5 w-3.5" />
        {actionLabel}
      </Button>
      <p className="text-center text-xs text-gray-500">
        Complete the{" "}
        <a
          href="#pre-fellowship-survey"
          className="font-medium text-fellowship-navy underline underline-offset-2"
        >
          Pre-Fellowship Survey
        </a>{" "}
        above to unlock this session.
      </p>
    </div>
  );
}
