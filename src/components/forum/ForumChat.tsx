"use client";
import React, { useEffect, useRef, useState } from "react";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import { ChatIcon, PaperPlaneIcon } from "@/icons";
import { toast } from "@/lib/toast";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import {
  listForumMessages,
  sendForumMessage,
  type ForumGroup,
  type ForumMessage,
} from "@/lib/api/fellow-forum";

/**
 * Group chat — flat-message UI (replaces the old thread/reply forum).
 * Layout mirrors AiBuddyChat: header, scrollable message list, footer
 * with composer. Group selector lives on the left for desktop and as
 * a horizontal scroll above the chat on mobile.
 *
 * Used by both fellow (`/forum`) and admin (`/forum`) — admin can post
 * in any group thanks to the backend's role-based bypass on the
 * post-gate.
 */
export default function ForumChat({
  groups,
  breadcrumb = "Home",
  breadcrumbHref = "/home",
}: {
  groups: ForumGroup[];
  breadcrumb?: string;
  breadcrumbHref?: string;
}) {
  const me = useCurrentUser();
  const isStaff =
    me?.role === "admin" || me?.role === "super_admin";

  // Visible groups: fellows see the ones they can read (server already
  // filters); admins see everything. Default selection is the first
  // group with `isMember = true`, falling back to the first visible.
  const visibleGroups = groups;
  const initialGroup =
    visibleGroups.find((g) => g.isMember) ?? visibleGroups[0] ?? null;
  const [activeGroupId, setActiveGroupId] = useState<string | null>(
    initialGroup?.id ?? null,
  );
  const activeGroup =
    visibleGroups.find((g) => g.id === activeGroupId) ?? null;

  const [messages, setMessages] = useState<ForumMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load messages whenever the active group changes.
  useEffect(() => {
    if (!activeGroupId) {
      setMessages([]);
      return;
    }
    let alive = true;
    setLoading(true);
    listForumMessages(activeGroupId)
      .then((m) => {
        if (alive) setMessages(m);
      })
      .catch(() => {
        if (alive) setMessages([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [activeGroupId]);

  // Auto-scroll on new messages.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function send() {
    const trimmed = draft.trim();
    if (!trimmed || !activeGroupId || sending) return;
    setSending(true);
    try {
      const m = await sendForumMessage(activeGroupId, trimmed);
      setMessages((prev) => [...prev, m]);
      setDraft("");
    } catch (err) {
      toast.errorFromException("Couldn't send message", err);
    } finally {
      setSending(false);
    }
  }

  // Membership rules for the composer.
  const canPost =
    activeGroup !== null &&
    (isStaff || activeGroup.isMember);
  const placeholder = !activeGroup
    ? "Pick a group to start chatting"
    : !canPost
      ? "Join this group before posting"
      : `Message #${activeGroup.slug}`;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: breadcrumb, href: breadcrumbHref },
          { label: "Forum" },
        ]}
      />
      <div data-tour="forum-heading">
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          Forum
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          {isStaff
            ? "Pick any group to engage, review, or monitor messages. Admins can post in every group."
            : "Cohort discussion — chat with fellows, mentors, and admins in your groups."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar — group list */}
        <aside
          data-tour="forum-groups"
          className="rounded-2xl border border-gray-200 bg-white p-3"
        >
          <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Groups
          </p>
          <ul className="flex flex-col gap-0.5">
            {visibleGroups.map((g) => {
              const active = g.id === activeGroupId;
              const locked = !isStaff && !g.isMember && !g.isPrivate;
              const hidden = !isStaff && !g.isMember && g.isPrivate;
              if (hidden) return null;
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => setActiveGroupId(g.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? "bg-fellowship-navy text-white"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="flex-1 truncate">{g.name}</span>
                    {locked && (
                      <Badge color="light" size="sm">
                        Locked
                      </Badge>
                    )}
                    {g.isPrivate && (
                      <Badge color={active ? "primary" : "info"} size="sm">
                        Private
                      </Badge>
                    )}
                  </button>
                </li>
              );
            })}
            {visibleGroups.length === 0 && (
              <li className="px-2 py-3 text-sm text-gray-500">
                No groups yet.
              </li>
            )}
          </ul>
        </aside>

        {/* Chat pane */}
        <section className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-fellowship-navy text-white">
              <ChatIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-semibold text-gray-800">
                {activeGroup?.name ?? "No group selected"}
              </p>
              <p className="truncate text-xs text-gray-500">
                {activeGroup?.description ??
                  "Select a group from the sidebar."}
              </p>
            </div>
            {activeGroup && (
              <span className="text-xs text-gray-500">
                {activeGroup.memberCount} member
                {activeGroup.memberCount === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div
            ref={scrollRef}
            className="flex h-[480px] flex-col gap-3 overflow-y-auto px-5 py-5 custom-scrollbar"
          >
            {loading && (
              <p className="text-sm text-gray-500">Loading messages…</p>
            )}
            {!loading && messages.length === 0 && activeGroup && (
              <p className="m-auto text-center text-sm text-gray-500">
                No messages yet in <strong>{activeGroup.name}</strong>.
                <br />
                Be the first to say something.
              </p>
            )}
            {!loading &&
              messages.map((m, i) => {
                const prev = messages[i - 1];
                const sameAuthor =
                  prev?.author.id === m.author.id &&
                  Date.parse(m.createdAt) - Date.parse(prev.createdAt) <
                    5 * 60 * 1000;
                return (
                  <MessageRow
                    key={m.id}
                    message={m}
                    showHeader={!sameAuthor}
                    isMine={m.author.id === me?.id}
                  />
                );
              })}
          </div>

          <div className="border-t border-gray-100 bg-white px-5 py-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={placeholder}
                disabled={!canPost || sending}
                className="flex-1 resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
              <Button
                size="md"
                variant="fellowship"
                type="submit"
                disabled={!canPost || !draft.trim() || sending}
                className="bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
              >
                <PaperPlaneIcon className="h-4 w-4" />
                {sending ? "Sending…" : "Send"}
              </Button>
            </form>
            <p className="mt-2 text-xs text-gray-400">
              Enter to send · Shift+Enter for a new line
              {isStaff &&
                activeGroup &&
                !activeGroup.isMember &&
                " · You're posting as admin in a group you're not a member of"}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function MessageRow({
  message,
  showHeader,
  isMine,
}: {
  message: ForumMessage;
  showHeader: boolean;
  isMine: boolean;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString(undefined, {
    timeZone: "Africa/Lagos",
    hour: "numeric",
    minute: "2-digit",
  });
  const roleLabel =
    message.author.role === "admin" || message.author.role === "super_admin"
      ? "Admin"
      : message.author.role === "faculty"
        ? "Faculty"
        : message.author.role === "mentor"
          ? "Mentor"
          : null;

  // Own messages render right-aligned in a dark navy bubble; everyone
  // else lands left-aligned in a light grey bubble. The avatar moves
  // with the bubble so eye-flow stays consistent for each side.
  return (
    <div
      className={`flex items-start gap-3 ${
        isMine ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {showHeader ? (
        <AvatarText name={message.author.fullName} className="h-9 w-9" />
      ) : (
        <div className="h-9 w-9 shrink-0" />
      )}
      <div className="flex min-w-0 max-w-[80%] flex-col">
        {showHeader && (
          <div
            className={`flex flex-wrap items-baseline gap-2 ${
              isMine ? "justify-end" : "justify-start"
            }`}
          >
            <span className="text-sm font-semibold text-gray-800">
              {message.author.fullName}
              {isMine && (
                <span className="ml-1 text-xs font-normal text-gray-400">
                  (you)
                </span>
              )}
            </span>
            {roleLabel && (
              <Badge color="info" size="sm">
                {roleLabel}
              </Badge>
            )}
            <span className="text-xs text-gray-400">{time}</span>
          </div>
        )}
        <div
          className={`mt-1 inline-block rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap wrap-break-word ${
            isMine
              ? "self-end bg-fellowship-navy text-white"
              : "self-start bg-gray-100 text-gray-800"
          }`}
        >
          {message.body}
        </div>
      </div>
    </div>
  );
}
