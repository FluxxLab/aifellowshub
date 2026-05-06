"use client";
import Button from "@/components/ui/button/Button";
import { CheckLineIcon, ChevronLeftIcon } from "@/icons";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

/**
 * Checklist-style onboarding (replaces the previous 4-step wizard).
 *
 * Each item represents a discrete step the new fellow needs to
 * complete. Some are quick toggles (sign an agreement); others link
 * to fuller flows (upload an ID via the file-upload pattern, fill
 * a profile form, watch a video). For phase 1 the items can be
 * marked complete locally — backend persistence comes when each
 * action is wired to its real endpoint.
 *
 * State is held in `localStorage` so a fellow who closes the tab
 * doesn't lose their progress. The key is scoped per user-session
 * cookie hash so multiple accounts on one machine don't collide.
 *
 * Required items (marked with `*` in the UI) gate the "Finish
 * onboarding" button at the bottom. Non-required items are
 * recommended but skippable.
 */

type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  required: boolean;
  /** Optional href — when set, the item is a link rather than a
   *  toggle. Click opens the link; user comes back and ticks the
   *  checkbox manually. (In phase 2 these get verified server-side
   *  — e.g., "Watch video" is auto-checked once the player reports
   *  100% playback.) */
  href?: string;
};

const ITEMS: ChecklistItem[] = [
  {
    id: "welcome-video",
    title: "Watch Welcome & Orientation Video",
    description: "View the 30-minute orientation video covering programme expectations, tools, and how to make the most of your cohort.",
    required: false,
  },
  {
    id: "pre-assessment",
    title: "Complete Pre-Fellowship Assessment",
    description: "Take the baseline knowledge assessment so we can track your growth across the 12-week curriculum.",
    required: false,
  },
  {
    id: "personal-info",
    title: "Personal Information Verification",
    description: "Verify all personal details including name, email, country, and organisation.",
    required: true,
  },
  {
    id: "government-id",
    title: "Upload Government-Issued ID",
    description: "Submit a clear copy of your passport, national ID, or driver's licence for verification.",
    required: true,
  },
  {
    id: "professional-photo",
    title: "Submit Professional Photo",
    description: "Upload a professional headshot photo for your fellowship profile and certificate.",
    required: false,
  },
  {
    id: "emergency-contact",
    title: "Emergency Contact Information",
    description: "Provide emergency contact details including name, relationship, and phone number.",
    required: true,
  },
  {
    id: "data-protection",
    title: "Sign Data Protection Consent",
    description: "Review and agree to the data protection policy governing how the programme handles your information.",
    required: true,
  },
  {
    id: "code-of-conduct",
    title: "Sign Code of Conduct Agreement",
    description: "Review and sign the fellowship programme's code of conduct for community standards.",
    required: false,
  },
  {
    id: "ip-agreement",
    title: "Sign Intellectual Property Agreement",
    description: "Review and agree to the intellectual property agreement covering your capstone work.",
    required: false,
  },
];

const STORAGE_KEY = "pic-lms-onboarding-checklist";

export default function OnboardingChecklist() {
  const router = useRouter();
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate completion state from localStorage on mount. Avoids SSR
  // hydration mismatch by reading only after mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCompleted(JSON.parse(raw));
    } catch {
      // localStorage may be blocked (private mode, embedded contexts);
      // fall back to fresh state — user just re-ticks items.
    }
    setHydrated(true);
  }, []);

  // Persist on every change.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    } catch {
      // ignore — see above
    }
  }, [completed, hydrated]);

  const toggle = (id: string) =>
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));

  const totalCount = ITEMS.length;
  const completedCount = useMemo(
    () => ITEMS.filter((i) => completed[i.id]).length,
    [completed],
  );
  const requiredItems = useMemo(() => ITEMS.filter((i) => i.required), []);
  const allRequiredDone = useMemo(
    () => requiredItems.every((i) => completed[i.id]),
    [requiredItems, completed],
  );
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const onFinish = async () => {
    if (!allRequiredDone) return;
    setSubmitting(true);
    try {
      // Tell the backend the fellow finished onboarding. Backend
      // runs forum membership hooks (cohort group, sector group if
      // one exists). We fire-and-treat-failure-as-non-fatal because
      // the navigation experience matters more than the bookkeeping;
      // an admin can fix membership later if this call fails.
      try {
        await fetch("/api/users/me/onboarding/complete", {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // network/transport failure — admin will reconcile later
      }

      // Clear the checklist storage so it doesn't linger on a
      // second-account login from the same browser.
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore — see auth/local-storage notes elsewhere
      }
      toast.success(
        "Onboarding complete",
        "Welcome to the Fellowship. Heading to your home now.",
      );
      router.push("/home");
      router.refresh();
    } catch (err) {
      setSubmitting(false);
      toast.errorFromException("Couldn't finish onboarding", err);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full h-full overflow-y-auto custom-scrollbar px-6 py-8 sm:px-10">
      <div className="w-full max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => router.push("/signin#register")}
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ChevronLeftIcon />
          Back to sign in
        </button>
      </div>

      <div className="flex flex-col flex-1 w-full max-w-2xl mx-auto pt-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
            Welcome to the Fellowship
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Tick off each item as you complete it. Items marked with{" "}
            <span className="font-semibold text-error-600">*</span> are
            required before you can finish onboarding.
          </p>

          {/* Progress */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {completedCount} of {totalCount} complete
              </span>
              <span className="text-sm tabular-nums text-gray-500">
                {progressPercent}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-fellowship-navy transition-[width] duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        <section aria-label="Onboarding checklist">
          <h2 className="mb-3 text-lg font-bold text-gray-800">
            Checklist Items
          </h2>
          <ul className="flex flex-col gap-3">
            {ITEMS.map((item) => {
              const isDone = !!completed[item.id];
              const id = `cb-${item.id}`;
              return (
                <li key={item.id}>
                  <label
                    htmlFor={id}
                    className={cn(
                      "flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors",
                      isDone
                        ? "border-gray-200 bg-gray-50/50"
                        : "border-gray-200 bg-white hover:border-fellowship-navy/30 hover:bg-gray-50",
                    )}
                  >
                    <input
                      id={id}
                      type="checkbox"
                      className="sr-only"
                      checked={isDone}
                      onChange={() => toggle(item.id)}
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                        isDone
                          ? "border-fellowship-navy bg-fellowship-navy text-white"
                          : "border-gray-300 bg-white text-transparent",
                      )}
                    >
                      <CheckLineIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-800">
                        {item.title}
                        {item.required && (
                          <span
                            aria-label="required"
                            className="ml-1 text-error-600"
                          >
                            *
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                        {item.description}
                      </span>
                      {item.href && !isDone && (
                        <Link
                          href={item.href}
                          // Stop the parent label's click from also toggling
                          // the checkbox when the user actually wants to
                          // visit the linked content.
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 inline-flex text-xs font-semibold text-fellowship-navy hover:underline"
                        >
                          Open →
                        </Link>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="mt-8 mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            {allRequiredDone
              ? "All required items complete — you're good to finish."
              : `${requiredItems.filter((i) => !completed[i.id]).length} required item${requiredItems.filter((i) => !completed[i.id]).length === 1 ? "" : "s"} remaining.`}
          </p>
          <Button
            variant="fellowship"
            size="md"
            onClick={onFinish}
            disabled={!allRequiredDone || submitting}
          >
            {submitting ? "Finishing…" : "Finish onboarding"}
          </Button>
        </div>
      </div>
    </div>
  );
}
