/**
 * Server-only forum fetcher (BRD §6.8). Maps backend thread/reply
 * payloads into the existing `ForumThreadSummary` / `ForumThread`
 * shapes. Group-aware: every thread carries its group ref so the UI
 * can render channel labels and filter by group.
 */
import "server-only";
import { backendFetch } from "./backend";
import type {
  ForumAuthor,
  ForumAuthorRole,
  ForumGroup,
  ForumReply,
  ForumThread,
  ForumThreadGroupRef,
  ForumThreadSummary,
} from "./fellow-forum";

type BackendAuthor = {
  id: string;
  fullName: string;
  role: string;
};

type BackendReply = {
  id: string;
  body: string;
  createdAt: string;
  author: BackendAuthor | null;
};

type BackendGroupRef = {
  id: string;
  slug: string;
  name: string;
} | null;

type BackendThreadSummary = {
  id: string;
  title: string;
  group: BackendGroupRef;
  preview: string;
  pinned: boolean;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  lastActivityAt: string;
  lastActivityBy: string;
  author: BackendAuthor | null;
};

type BackendThread = BackendThreadSummary & {
  body: string;
  replies: BackendReply[];
};

/** GET /forum/threads — optionally scoped to a single group. Empty
 *  array on backend failure so the page doesn't 500 just because the
 *  forum is misconfigured. */
export async function getForumThreadsServer(
  options: { groupId?: string } = {},
): Promise<ForumThreadSummary[]> {
  try {
    const path = options.groupId
      ? `/forum/threads?groupId=${encodeURIComponent(options.groupId)}`
      : "/forum/threads";
    const res = await backendFetch(path, { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as { threads: BackendThreadSummary[] };
    return (data.threads ?? []).map(mapSummary);
  } catch {
    return [];
  }
}

/** GET /forum/groups — directory of groups visible to the current
 *  user (member groups + non-private groups). */
export async function getForumGroupsServer(): Promise<ForumGroup[]> {
  try {
    const res = await backendFetch("/forum/groups", { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as { groups: ForumGroup[] };
    return data.groups ?? [];
  } catch {
    return [];
  }
}

export async function getForumThreadServer(
  id: string,
): Promise<ForumThread | null> {
  try {
    const res = await backendFetch(
      `/forum/threads/${encodeURIComponent(id)}`,
      { method: "GET" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { thread: BackendThread };
    return mapDetail(data.thread);
  } catch {
    return null;
  }
}

function mapAuthor(a: BackendAuthor | null): ForumAuthor {
  if (!a) {
    return { id: "unknown", fullName: "Unknown", role: "fellow" };
  }
  return { id: a.id, fullName: a.fullName, role: mapRole(a.role) };
}

function mapRole(role: string): ForumAuthorRole {
  if (role === "fellow" || role === "mentor" || role === "faculty") return role;
  if (role === "admin" || role === "super_admin") return "admin";
  return "fellow";
}

function mapGroupRef(g: BackendGroupRef): ForumThreadGroupRef | null {
  if (!g) return null;
  return { id: g.id, slug: g.slug, name: g.name };
}

function mapReply(r: BackendReply): ForumReply {
  return {
    id: r.id,
    body: r.body,
    author: mapAuthor(r.author),
    createdAt: r.createdAt,
    reactions: { up: 0, heart: 0 },
  };
}

function mapSummary(t: BackendThreadSummary): ForumThreadSummary {
  return {
    id: t.id,
    title: t.title,
    group: mapGroupRef(t.group),
    preview: t.preview,
    author: mapAuthor(t.author),
    createdAt: t.createdAt,
    pinned: t.pinned,
    locked: t.locked,
    replyCount: t.replyCount,
    lastActivityAt: t.lastActivityAt,
    lastActivityBy: t.lastActivityBy,
    reactions: { up: 0, heart: 0 },
  };
}

function mapDetail(t: BackendThread): ForumThread {
  return {
    ...mapSummary(t),
    body: t.body,
    replies: t.replies.map(mapReply),
  };
}
