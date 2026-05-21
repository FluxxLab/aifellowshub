"use client";
import React, { useState } from "react";
import Button from "@/components/ui/button/Button";
import LessonContent from "@/components/fellow/LessonContent";
import { ChevronDownIcon, TimeIcon } from "@/icons";
import type { Lesson } from "@/lib/api/fellow-learning";

/**
 * Fellow-facing lessons list.
 *
 * Click a lesson's `Start` / `Resume` / `Re-watch` / `Re-read` button to expand
 * the row inline and render the uploaded content (video player /
 * PDF iframe / image) via `<LessonContent>`. Re-clicking the same
 * row collapses it; opening another lesson swaps the expanded one
 * (single-expand behaviour) — keeps the page focused and easy to
 * scan compared to letting the whole list balloon.
 *
 * Note: this component intentionally has no `markComplete` action.
 * BRD §6.3 unlocks the next module on session attendance OR
 * assessment pass — lesson-level completion tracking is out of
 * scope until the backend exposes it. Until then the status badge
 * (completed / in-progress / not-started) just reflects whatever
 * the API returns.
 */
export default function LessonsList({ lessons }: { lessons: Lesson[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const completed = lessons.filter((l) => l.status === "completed").length;

  const toggle = (id: string) =>
    setOpenId((prev) => (prev === id ? null : id));

  if (lessons.length === 0) return null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Lessons</h2>
        <span className="text-sm text-gray-500">
          {completed} of {lessons.length} complete
        </span>
      </div>

      <ol className="mt-4 divide-y divide-gray-100">
        {lessons.map((l) => {
          const isOpen = openId === l.id;
          return (
            <li key={l.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start gap-4">
                <LessonStatusOrb status={l.status} />
                <button
                  type="button"
                  onClick={() => toggle(l.id)}
                  aria-expanded={isOpen}
                  aria-controls={`lesson-${l.id}-body`}
                  className="flex-1 text-left rounded-md -mx-1 px-1 py-0.5 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-fellowship-navy/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {l.kind}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <TimeIcon className="h-3.5 w-3.5" />
                      {l.durationMinutes} min
                    </span>
                  </div>
                  <h3
                    className={`mt-1 text-sm font-semibold transition-colors group-hover:text-fellowship-navy ${
                      l.status === "not-started" ? "text-gray-700" : "text-gray-800"
                    }`}
                  >
                    {l.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">{l.summary}</p>
                </button>
                <div className="shrink-0 pt-1">
                  <Button
                    size="sm"
                    variant={l.status === "in-progress" ? "fellowship" : "outline"}
                    onClick={() => toggle(l.id)}
                    aria-expanded={isOpen}
                  >
                    {isOpen
                      ? "Close"
                      : l.status === "in-progress"
                      ? "Resume"
                      : l.kind === "video"
                      ? "Re-watch"
                      : l.status === "completed"
                      ? "Re-read"
                      : "Start"}
                    <ChevronDownIcon
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </div>
              </div>

              {isOpen && (
                <div id={`lesson-${l.id}-body`} className="mt-4 ml-10">
                  <LessonContent
                    contentUrl={l.contentUrl}
                    contentMimeType={l.contentMimeType}
                    title={l.title}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function LessonStatusOrb({ status }: { status: Lesson["status"] }) {
  if (status === "completed") {
    return (
      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-600">
        <CheckMark />
      </div>
    );
  }
  if (status === "in-progress") {
    return (
      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning-100 text-warning-600">
        <Dot />
      </div>
    );
  }
  return (
    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-gray-200" />
  );
}

function CheckMark() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 7L6 10L11 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Dot() {
  return (
    <span className="block h-2 w-2 rounded-full bg-current" aria-hidden />
  );
}
