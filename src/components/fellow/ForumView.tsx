"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import { ChatIcon, ChevronRightIcon, LockIcon, PaperPlaneIcon, PlusIcon } from "@/icons";
import { toast } from "@/lib/toast";
import {
  createForumThread,
  type ForumGroup,
  type ForumThreadGroupRef,
  type ForumThreadSummary,
} from "@/lib/api/fellow-forum";

/**
 * Forum directory + thread list.
 *
 * Layout: a left rail of groups (the channels the fellow is in,
 * plus locked previews of non-private groups they could be added
 * to) + a main column showing threads in the selected group.
 *
 * "All" tab shows threads across every group the fellow is a
 * member of. Locked groups in the rail are clickable but explain
 * why the fellow can't post yet.
 */
type Filter = "all" | string; // groupId or "all"

export default function ForumView({
  threads: initialThreads,
  groups,
}: {
  threads: ForumThreadSummary[];
  groups: ForumGroup[];
}) {
  const [threads, setThreads] = useState(initialThreads);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);

  const memberGroups = useMemo(
    () => groups.filter((g) => g.isMember),
    [groups],
  );
  const lockedGroups = useMemo(
    () => groups.filter((g) => !g.isMember),
    [groups],
  );

  const pinned = threads.filter((t) => t.pinned);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads
      .filter((t) => !t.pinned)
      .filter((t) => {
        if (filter !== "all" && t.group?.id !== filter) return false;
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

  const activeGroup =
    filter === "all" ? null : memberGroups.find((g) => g.id === filter);
  const composerDefaultGroup = activeGroup ?? memberGroups[0];

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
            Cohort discussion. Pick a channel from the left, or post in{" "}
            <strong>General</strong> for anything everyone should see.
          </p>
        </div>
        {composerDefaultGroup && (
          <Button
            size="md"
            variant="fellowship"
            onClick={() => setComposerOpen((o) => !o)}
          >
            <PlusIcon className="h-4 w-4" />
            New thread
          </Button>
        )}
      </div>

      {composerOpen && composerDefaultGroup && (
        <NewThreadComposer
          groups={memberGroups}
          defaultGroupId={composerDefaultGroup.id}
          onCancel={() => setComposerOpen(false)}
          onPost={onPost}
        />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_minmax(0,1fr)] md:gap-6">
        {/* Group rail */}
        <aside className="flex flex-col gap-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Your channels
            </h2>
            <nav className="flex flex-col gap-1">
              <RailButton
                active={filter === "all"}
                onClick={() => setFilter("all")}
              >
                All channels
                <span className="ml-auto text-xs text-gray-400">
                  {threads.length}
                </span>
              </RailButton>
              {memberGroups.map((g) => (
                <RailButton
                  key={g.id}
                  active={filter === g.id}
                  onClick={() => setFilter(g.id)}
                >
                  <span className="truncate">{g.name}</span>
                  <span className="ml-auto text-xs text-gray-400">
                    {g.threadCount}
                  </span>
                </RailButton>
              ))}
            </nav>
          </section>

          {lockedGroups.length > 0 && (
            <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Other channels
              </h2>
              <ul className="flex flex-col gap-2">
                {lockedGroups.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
                  >
                    <LockIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-700">
                        {g.name}
                      </p>
                      {g.description && (
                        <p className="truncate text-xs text-gray-500">
                          {g.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                Admins add you to channels as you progress through the
                programme.
              </p>
            </section>
          )}
        </aside>

        {/* Thread list */}
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search threads…"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
            />
            {activeGroup?.description && (
              <p className="mt-3 text-sm text-gray-500">
                {activeGroup.description}
              </p>
            )}
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
              {filter === "all"
                ? "Recent across your channels"
                : `${activeGroup?.name ?? "Channel"} threads`}
            </h2>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <p className="text-sm text-gray-500">
                  No threads yet — start one yourself?
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
      </div>
    </div>
  );
}

function RailButton({
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
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
        active
          ? "bg-fellowship-navy text-white"
          : "text-gray-700 hover:bg-gray-50 hover:text-fellowship-navy"
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
          <GroupBadge group={t.group} />
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
  groups,
  defaultGroupId,
  onCancel,
  onPost,
}: {
  groups: ForumGroup[];
  defaultGroupId: string;
  onCancel: () => void;
  onPost: (t: ForumThreadSummary) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [groupId, setGroupId] = useState<string>(defaultGroupId);
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
        groupId,
      });
      // Synthesize a list-summary so the UI can render it without re-fetching.
      const summary: ForumThreadSummary = {
        id: created.id,
        title: created.title,
        group: created.group,
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
            Channel
          </label>
          <div className="mt-1 flex flex-wrap gap-2">
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGroupId(g.id)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  groupId === g.id
                    ? "border-fellowship-navy bg-fellowship-navy text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-fellowship-navy/30 hover:bg-gray-50"
                }`}
              >
                {g.name}
              </button>
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

function GroupBadge({ group }: { group: ForumThreadGroupRef | null }) {
  if (!group) return null;
  return (
    <Badge color="info" variant="light">
      {group.name}
    </Badge>
  );
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
