/**
 * Community Forum — public interface (BRD §6.8).
 *
 * Reads run through the server fetcher (`fellow-forum.server.ts`); this
 * file holds public types + client-safe mutators that pages call from
 * the browser. Server-only helpers must NOT be imported here.
 */
import { apiFetch } from "./client";

export type ForumCategory =
  | "general"
  | "curriculum"
  | "capstone"
  | "cohort"
  | "off-topic";

export type ForumAuthorRole = "fellow" | "mentor" | "faculty" | "admin";

export type ForumAuthor = {
  id: string;
  fullName: string;
  role: ForumAuthorRole;
};

export type ForumReply = {
  id: string;
  body: string;
  author: ForumAuthor;
  createdAt: string;
  reactions: { up: number; heart: number };
};

export type ForumThreadSummary = {
  id: string;
  title: string;
  category: ForumCategory;
  /** First ~150 chars of the body, used in the list. */
  preview: string;
  author: ForumAuthor;
  createdAt: string;
  pinned: boolean;
  locked: boolean;
  replyCount: number;
  /** ISO timestamp of the last reply (or createdAt if no replies yet). */
  lastActivityAt: string;
  lastActivityBy: string;
  reactions: { up: number; heart: number };
};

export type ForumThread = ForumThreadSummary & {
  /** Full original-post body. */
  body: string;
  replies: ForumReply[];
};

export const FORUM_CATEGORIES: { value: ForumCategory; label: string; description: string }[] = [
  { value: "general", label: "General", description: "Anything Fellowship-wide" },
  { value: "curriculum", label: "Curriculum", description: "Module questions and reading discussion" },
  { value: "capstone", label: "Capstone", description: "Scoping, feedback, collaboration" },
  { value: "cohort", label: "Cohort", description: "Meetups, intros, your cohort" },
  { value: "off-topic", label: "Off-topic", description: "Everything else" },
];


/* ---------- Client-side mutators (BRD §6.8) ---------- */

export type CreateThreadPayload = {
  title: string;
  body: string;
  category?: ForumCategory;
};

/** POST /forum/threads. Backend uses `off_topic` underscore — translate. */
export async function createForumThread(
  payload: CreateThreadPayload,
): Promise<ForumThread> {
  const data = await apiFetch<{ thread: ForumThread }>("/forum/threads", {
    method: "POST",
    body: {
      title: payload.title,
      body: payload.body,
      category:
        payload.category === "off-topic"
          ? "off_topic"
          : payload.category ?? "general",
    },
  });
  return data.thread;
}

export async function postForumReply(
  threadId: string,
  body: string,
): Promise<ForumReply> {
  const data = await apiFetch<{ reply: ForumReply }>(
    `/forum/threads/${encodeURIComponent(threadId)}/replies`,
    { method: "POST", body: { body } },
  );
  return data.reply;
}
