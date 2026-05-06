"use client";
import React, { useState } from "react";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import { PaperPlaneIcon, ShootingStarIcon } from "@/icons";
import { toast } from "@/lib/toast";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import {
  postForumReply,
  type ForumAuthorRole,
  type ForumReply,
  type ForumThread,
  type ForumThreadGroupRef,
} from "@/lib/api/fellow-forum";

export default function ForumThreadView({
  thread,
}: {
  thread: ForumThread;
}) {
  const user = useCurrentUser();
  const [replies, setReplies] = useState<ForumReply[]>(thread.replies);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [opReactions, setOpReactions] = useState(thread.reactions);
  const [opReacted, setOpReacted] = useState<{ up: boolean; heart: boolean }>({
    up: false,
    heart: false,
  });

  const onPost = async () => {
    const trimmed = draft.trim();
    if (trimmed.length < 5 || posting) return;
    setPosting(true);
    // Optimistic — append immediately so the textarea clears fast.
    const optimisticId = `r-tmp-${Date.now()}`;
    setReplies((prev) => [
      ...prev,
      {
        id: optimisticId,
        body: trimmed,
        author: {
          id: user.id,
          fullName: user.fullName,
          role: roleAsForumRole(user.role),
        },
        createdAt: new Date().toISOString(),
        reactions: { up: 0, heart: 0 },
      },
    ]);
    setDraft("");

    try {
      const saved = await postForumReply(thread.id, trimmed);
      // Replace optimistic row with the canonical server reply (real id, etc.)
      setReplies((prev) =>
        prev.map((r) =>
          r.id === optimisticId
            ? { ...saved, reactions: { up: 0, heart: 0 } }
            : r,
        ),
      );
    } catch (err) {
      setReplies((prev) => prev.filter((r) => r.id !== optimisticId));
      setDraft(trimmed);
      toast.errorFromException("Couldn't post reply", err);
    }
    setPosting(false);
  };

  const toggleOpReaction = (kind: "up" | "heart") => {
    setOpReactions((prev) => ({
      ...prev,
      [kind]: prev[kind] + (opReacted[kind] ? -1 : 1),
    }));
    setOpReacted((prev) => ({ ...prev, [kind]: !prev[kind] }));
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Forum", href: "/forum" },
          { label: thread.title },
        ]}
      />

      <article className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <GroupBadge group={thread.group} />
          {thread.pinned && (
            <Badge color="warning" variant="light">
              <ShootingStarIcon className="h-3 w-3" />
              Pinned
            </Badge>
          )}
          {thread.locked && (
            <Badge color="light" variant="light">
              Locked
            </Badge>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gray-800 sm:text-3xl">
          {thread.title}
        </h1>

        <div className="mt-4 flex items-start gap-3">
          <AvatarText name={thread.author.fullName} className="h-10 w-10" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-800">
                {thread.author.fullName}
              </p>
              <RoleBadge role={thread.author.role} />
              <span className="text-xs text-gray-500">
                · {relativeTime(thread.createdAt)}
              </span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {thread.body}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <ReactionButton
                emoji="👍"
                count={opReactions.up}
                active={opReacted.up}
                onClick={() => toggleOpReaction("up")}
              />
              <ReactionButton
                emoji="❤️"
                count={opReactions.heart}
                active={opReacted.heart}
                onClick={() => toggleOpReaction("heart")}
              />
            </div>
          </div>
        </div>
      </article>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          {replies.length} {replies.length === 1 ? "reply" : "replies"}
        </h2>
        <div className="flex flex-col gap-3">
          {replies.map((r) => (
            <ReplyBubble key={r.id} reply={r} />
          ))}
        </div>
      </section>

      {thread.locked ? (
        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">
          <p className="text-sm text-gray-500">
            This thread is locked — no new replies.
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Reply as {user.fullName}
          </p>
          <textarea
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add to the conversation…"
            className="mt-2 w-full resize-y rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              variant="fellowship"
              onClick={onPost}
              disabled={draft.trim().length < 5 || posting}
            >
              <PaperPlaneIcon className="h-4 w-4" />
              {posting ? "Posting…" : "Post reply"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function ReplyBubble({ reply: r }: { reply: ForumReply }) {
  const [reactions, setReactions] = useState(r.reactions);
  const [reacted, setReacted] = useState<{ up: boolean; heart: boolean }>({
    up: false,
    heart: false,
  });

  const toggle = (kind: "up" | "heart") => {
    setReactions((prev) => ({
      ...prev,
      [kind]: prev[kind] + (reacted[kind] ? -1 : 1),
    }));
    setReacted((prev) => ({ ...prev, [kind]: !prev[kind] }));
  };

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5">
      <AvatarText name={r.author.fullName} className="h-9 w-9" />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-gray-800">
            {r.author.fullName}
          </p>
          <RoleBadge role={r.author.role} />
          <span className="text-xs text-gray-500">
            · {relativeTime(r.createdAt)}
          </span>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {r.body}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <ReactionButton
            emoji="👍"
            count={reactions.up}
            active={reacted.up}
            onClick={() => toggle("up")}
          />
          <ReactionButton
            emoji="❤️"
            count={reactions.heart}
            active={reacted.heart}
            onClick={() => toggle("heart")}
          />
        </div>
      </div>
    </div>
  );
}

function ReactionButton({
  emoji,
  count,
  active,
  onClick,
}: {
  emoji: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-fellowship-navy bg-fellowship-navy/5 text-fellowship-navy"
          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      }`}
      aria-pressed={active}
    >
      <span>{emoji}</span>
      <span>{count}</span>
    </button>
  );
}

function RoleBadge({ role }: { role: ForumAuthorRole }) {
  if (role === "fellow") return null;
  const colour: Record<ForumAuthorRole, "info" | "warning" | "success" | "light"> = {
    fellow: "light",
    mentor: "info",
    faculty: "warning",
    admin: "success",
  };
  const label: Record<ForumAuthorRole, string> = {
    fellow: "Fellow",
    mentor: "Mentor",
    faculty: "Faculty",
    admin: "Admin",
  };
  return (
    <Badge color={colour[role]} variant="light">
      {label[role]}
    </Badge>
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

function roleAsForumRole(role: string): ForumAuthorRole {
  if (role === "mentor") return "mentor";
  if (role === "faculty") return "faculty";
  if (role === "admin" || role === "super_admin") return "admin";
  return "fellow";
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
