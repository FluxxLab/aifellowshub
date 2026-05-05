/**
 * Server-only forum fetcher (BRD §6.8). Maps backend thread/reply payloads
 * into the existing `ForumThreadSummary` / `ForumThread` shapes.
 */
import "server-only";
import { backendFetch } from "./backend";
import type {
  ForumAuthor,
  ForumAuthorRole,
  ForumCategory,
  ForumReply,
  ForumThread,
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

type BackendThreadSummary = {
  id: string;
  title: string;
  category: "general" | "curriculum" | "capstone" | "cohort" | "off_topic";
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

export async function getForumThreadsServer(): Promise<ForumThreadSummary[]> {
  try {
    const res = await backendFetch("/forum/threads", { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as { threads: BackendThreadSummary[] };
    return (data.threads ?? []).map(mapSummary);
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

function mapCategory(c: BackendThreadSummary["category"]): ForumCategory {
  return c === "off_topic" ? "off-topic" : c;
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
    category: mapCategory(t.category),
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
