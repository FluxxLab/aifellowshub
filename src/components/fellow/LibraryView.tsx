"use client";
import React, { useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import {
  ChevronRightIcon,
  DocsIcon,
  FileIcon,
  ShootingStarIcon,
  TableIcon,
  TimeIcon,
  VideoIcon,
} from "@/icons";
import type {
  LibraryResource,
  ResourceKind,
} from "@/lib/api/fellow-library";

type KindFilter = "all" | ResourceKind;
type SourceFilter = "all" | "featured" | number; // number = weekNumber

const KIND_FILTERS: { value: KindFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pdf", label: "PDF" },
  { value: "link", label: "Link" },
  { value: "video", label: "Video" },
  { value: "dataset", label: "Dataset" },
];

export default function LibraryView({
  resources,
}: {
  resources: LibraryResource[];
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [source, setSource] = useState<SourceFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (kind !== "all" && r.kind !== kind) return false;
      if (source === "featured" && !r.featured) return false;
      if (typeof source === "number" && r.source?.weekNumber !== source) return false;
      if (!q) return true;
      const haystack = [
        r.title,
        r.description,
        r.source?.moduleTitle ?? "",
        r.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [resources, query, kind, source]);

  const featured = resources.filter((r) => r.featured);

  // Available week numbers, in order, for the source filter chips.
  const weeks = Array.from(
    new Set(
      resources
        .map((r) => r.source?.weekNumber)
        .filter((w): w is number => typeof w === "number")
    )
  ).sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Library" },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">Library</h1>
        <p className="mt-2 max-w-3xl text-gray-600">
          Readings, audits, frameworks, and templates across the Fellowship
          curriculum. Featured items are faculty-curated; everything else is
          tied to a module.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, topic, or tag…"
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
        />

        <div className="mt-4 flex flex-col gap-3">
          <FilterRow label="Kind">
            {KIND_FILTERS.map((f) => (
              <FilterChip
                key={f.value}
                active={kind === f.value}
                onClick={() => setKind(f.value)}
              >
                {f.label}
              </FilterChip>
            ))}
          </FilterRow>

          <FilterRow label="Source">
            <FilterChip
              active={source === "all"}
              onClick={() => setSource("all")}
            >
              All
            </FilterChip>
            <FilterChip
              active={source === "featured"}
              onClick={() => setSource("featured")}
            >
              <ShootingStarIcon className="h-3.5 w-3.5" />
              Featured
            </FilterChip>
            {weeks.map((w) => (
              <FilterChip
                key={w}
                active={source === w}
                onClick={() => setSource(w)}
              >
                Week {w}
              </FilterChip>
            ))}
          </FilterRow>
        </div>
      </section>

      {/* Featured strip — only show when not actively filtering */}
      {kind === "all" && source === "all" && !query && (
        <section>
          <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-gray-800">
            <ShootingStarIcon className="h-5 w-5 text-warning-500" />
            Featured
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((r) => (
              <ResourceCard key={r.id} resource={r} compact />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {filtered.length === resources.length
              ? "All resources"
              : `${filtered.length} of ${resources.length} resources`}
          </h2>
          {(query || kind !== "all" || source !== "all") && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setKind("all");
                setSource("all");
              }}
              className="text-sm font-medium text-fellowship-navy hover:text-fellowship-navy-dark"
            >
              Clear filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-sm text-gray-500">
              No resources match those filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-fellowship-navy bg-fellowship-navy text-white"
          : "border-gray-200 bg-white text-gray-700 hover:border-fellowship-navy/30 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function ResourceCard({
  resource: r,
  compact = false,
}: {
  resource: LibraryResource;
  compact?: boolean;
}) {
  return (
    <a
      href={r.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-fellowship-navy/30 hover:bg-gray-50"
    >
      <div className="flex items-start gap-3">
        <KindIcon kind={r.kind} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-gray-500">
              {r.kind}
            </span>
            <span className="text-gray-300">·</span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <TimeIcon className="h-3.5 w-3.5" />
              {r.durationMinutes} min
            </span>
            {r.source && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500">
                  Week {r.source.weekNumber}
                </span>
              </>
            )}
          </div>
          <h3 className="mt-1 text-sm font-semibold text-gray-800 group-hover:text-fellowship-navy">
            {r.title}
          </h3>
          {!compact && (
            <p className="mt-1 text-sm text-gray-600">{r.description}</p>
          )}
          {!compact && r.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {r.tags.map((t) => (
                <Badge key={t} color="light" variant="light">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-fellowship-navy" />
      </div>
    </a>
  );
}

function KindIcon({ kind }: { kind: ResourceKind }) {
  if (kind === "pdf") {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-error-50 text-error-500">
        <FileIcon className="h-4 w-4" />
      </span>
    );
  }
  if (kind === "video") {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
        <VideoIcon className="h-4 w-4" />
      </span>
    );
  }
  if (kind === "dataset") {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success-50 text-success-600">
        <TableIcon className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info-50 text-info-500">
      <DocsIcon className="h-4 w-4" />
    </span>
  );
}
