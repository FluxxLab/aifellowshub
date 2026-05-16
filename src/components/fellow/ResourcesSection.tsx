"use client";
import React, { useState } from "react";
import { DocsIcon, FileIcon, VideoIcon, ChevronDownIcon } from "@/icons";
import type { ModuleResource } from "@/lib/api/fellow-learning";

export default function ResourcesSection({
  resources,
}: {
  resources: ModuleResource[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (resources.length === 0) return null;

  const toggle = (id: string) =>
    setOpenId((prev) => (prev === id ? null : id));

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <h2 className="text-lg font-semibold text-gray-800">Reading &amp; resources</h2>
      <ul className="mt-4 divide-y divide-gray-100">
        {resources.map((r) => {
          const isPdf = r.kind === "pdf";
          const isOpen = openId === r.id;

          if (isPdf) {
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => toggle(r.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-3 -mx-2 text-left transition-colors hover:bg-gray-50"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <ResourceIcon kind={r.kind} />
                    <span className="text-sm text-gray-800">{r.title}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-xs uppercase tracking-wide">PDF</span>
                    <ChevronDownIcon
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>
                {isOpen && (
                  <div className="mb-3 overflow-hidden rounded-xl border border-gray-200">
                    <iframe
                      src={r.url}
                      title={r.title}
                      className="h-[70vh] w-full"
                    />
                  </div>
                )}
              </li>
            );
          }

          return (
            <li key={r.id}>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-md px-2 py-3 -mx-2 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <ResourceIcon kind={r.kind} />
                  <span className="text-sm text-gray-800">{r.title}</span>
                </div>
                <span className="text-xs uppercase tracking-wide text-gray-500">
                  {r.kind}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ResourceIcon({ kind }: { kind: ModuleResource["kind"] }) {
  if (kind === "pdf") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-error-50 text-error-500">
        <FileIcon className="h-4 w-4" />
      </span>
    );
  }
  if (kind === "video") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-warning-50 text-warning-600">
        <VideoIcon className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-info-50 text-info-500">
      <DocsIcon className="h-4 w-4" />
    </span>
  );
}
