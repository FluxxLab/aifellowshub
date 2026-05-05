"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import { ChatIcon, ChevronRightIcon, PaperPlaneIcon, PlusIcon } from "@/icons";
import { toast } from "@/lib/toast";
import {
  FORUM_CATEGORIES,
  createForumThread,
  type ForumCategory,
  type ForumThreadSummary,
} from "@/lib/api/fellow-forum";

type Filter = "all" | ForumCategory;

export default function ForumView({
  threads: initialThreads,
}: {
  threads: ForumThreadSummary[];
}) {
  const [threads, setThreads] = useState(initialThreads);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);

  const pinned = threads.filter((t) => t.pinned);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads
      .filter((t) => !t.pinned)
      .filter((t) => {
        if (filter !== "all" && t.category !== filter) return false;
        if (!q) return true;
        const haystack = `${t.title} ${t.preview} ${t.author.fullName}`.toLowerCase();
        return haystack.includes(q);
      })
      .sort(
        (a, b) =>
          +new Date(b.lastActivityAt) - +new Date(a.lastActivityAt)
      );
  }, [threads, filter, query]);

  const onPost = (newThread: ForumThreadSummary) => {
    setThreads((prev) => [newThread, ...prev]);
    setComposerOpen(false);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Forum" },
        ]}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">Forum</h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Cohort discussion — module questions, capstone scoping, meetups,
            and the rest.
          </p>
        </div>
        <Button
          size="md"
          variant="fellowship"
          onClick={() => setComposerOpen((o) => !o)}
        >
          <PlusIcon className="h-4 w-4" />
          New thread
        </Button>
      </div>

      {composerOpen && (
        <NewThreadComposer
          onCancel={() => setComposerOpen(false)}
          onPost={onPost}
        />
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search threads…"
          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
        />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          {FORUM_CATEGORIES.map((c) => (
            <FilterChip
              key={c.value}
              active={filter === c.value}
              onClick={() => setFilter(c.value)}
            >
              {c.label}
            </FilterChip>
          ))}
        </div>
      </section>

      {pinned.length > 0 && filter === "all" && !query && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Pinned
          </h2>
          <div className="flex flex-col gap-3">
            {pinned.map((t) => (
              <ThreadRow key={t.id} thread={t} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {filter === "all" ? "Recent" : `${categoryLabel(filter)} threads`}
        </h2>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-sm text-gray-500">
              No threads match — start one yourself?
            </p>
          </div>
        ) : (
          <motion.div layout className="flex flex-col gap-3">
            <AnimatePresence initial={false} mode="popLayout">
              {filtered.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ThreadRow thread={t} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
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

function ThreadRow({ thread: t }: { thread: ForumThreadSummary }) {
  return (
    <Link
      href={`/forum/${t.id}`}
      className="group flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-colors hover:border-fellowship-navy/30 hover:bg-gray-50"
    >
      <AvatarText name={t.author.fullName} className="h-10 w-10" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-gray-800 group-hover:text-fellowship-navy">
            {t.title}
          </h3>
          <CategoryBadge category={t.category} />
          {t.locked && (
            <Badge color="light" variant="light">
              Locked
            </Badge>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-gray-600">{t.preview}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span>
            by <span className="text-gray-700">{t.author.fullName}</span>
            {t.author.role !== "fellow" && (
              <span className="ml-1 inline-flex items-center rounded bg-info-50 px-1.5 py-0.5 text-info-700">
                {t.author.role}
              </span>
            )}
          </span>
          <span className="text-gray-300">·</span>
          <span className="inline-flex items-center gap-1">
            <ChatIcon className="h-3.5 w-3.5" />
            {t.replyCount} {t.replyCount === 1 ? "reply" : "replies"}
          </span>
          <span className="text-gray-300">·</span>
          <span>
            last activity {relativeTime(t.lastActivityAt)} by {t.lastActivityBy}
          </span>
        </div>
      </div>
      <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-gray-400 group-hover:text-fellowship-navy" />
    </Link>
  );
}

function NewThreadComposer({
  onCancel,
  onPost,
}: {
  onCancel: () => void;
  onPost: (t: ForumThreadSummary) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<ForumCategory>("general");
  const [posting, setPosting] = useState(false);

  const canPost =
    title.trim().length >= 8 && body.trim().length >= 20 && !posting;

  const post = async () => {
    if (!canPost) return;
    setPosting(true);
    try {
      const created = await createForumThread({
        title: title.trim(),
        body: body.trim(),
        category,
      });
      // Synthesize a list-summary so the UI can render it without re-fetching.
      const summary: ForumThreadSummary = {
        id: created.id,
        title: created.title,
        category: created.category,
        preview: created.preview,
        author: created.author,
        createdAt: created.createdAt,
        pinned: created.pinned,
        locked: created.locked,
        replyCount: 0,
        lastActivityAt: created.lastActivityAt,
        lastActivityBy: created.lastActivityBy,
        reactions: { up: 0, heart: 0 },
      };
      onPost(summary);
      // Navigate to the new thread so the fellow can see + share it.
      router.push(`/forum/${encodeURIComponent(created.id)}`);
    } catch (err) {
      toast.errorFromException("Couldn't post thread", err);
    }
    setPosting(false);
  };

  return (
    <section className="rounded-2xl border border-fellowship-navy/30 bg-white p-5 md:p-6">
      <h2 className="text-base font-semibold text-gray-800">Start a thread</h2>
      <div className="mt-4 space-y-3">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's the question?"
            className="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Category
          </label>
          <div className="mt-1 flex flex-wrap gap-2">
            {FORUM_CATEGORIES.map((c) => (
              <FilterChip
                key={c.value}
                active={category === c.value}
                onClick={() => setCategory(c.value)}
              >
                {c.label}
              </FilterChip>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Body
          </label>
          <textarea
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Be specific — context helps people give you useful answers."
            className="mt-1 w-full resize-y rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
          />
          <p className="mt-1 text-xs text-gray-400">
            Title ≥ 8 chars · Body ≥ 20 chars
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" variant="fellowship" onClick={post} disabled={!canPost}>
          <PaperPlaneIcon className="h-4 w-4" />
          {posting ? "Posting…" : "Post thread"}
        </Button>
      </div>
    </section>
  );
}

function CategoryBadge({ category }: { category: ForumCategory }) {
  const colour: Record<
    ForumCategory,
    "info" | "warning" | "success" | "light"
  > = {
    general: "info",
    curriculum: "warning",
    capstone: "success",
    cohort: "info",
    "off-topic": "light",
  };
  return (
    <Badge color={colour[category]} variant="light">
      {categoryLabel(category)}
    </Badge>
  );
}

function categoryLabel(c: ForumCategory): string {
  return FORUM_CATEGORIES.find((x) => x.value === c)?.label ?? c;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return `${Math.round(days / 30)} months ago`;
}
