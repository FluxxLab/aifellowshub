/**
 * Community Forum — public interface (BRD §6.8).
 *
 * Reads run through the server fetcher (`fellow-forum.server.ts`); this
 * file holds public types + client-safe mutators that pages call from
 * the browser. Server-only helpers must NOT be imported here.
 *
 * Group-aware shape: every thread belongs to a ForumGroup. Groups
 * replace the old hard-coded category enum so admins can create new
 * channels (cohort, sector, mentor 1:1) on the fly. See backend
 * ForumService for visibility rules.
 */
import { apiFetch } from "./client";

export type ForumAuthorRole = "fellow" | "mentor" | "faculty" | "admin";

export type ForumAuthor = {
  id: string;
  fullName: string;
  role: ForumAuthorRole;
};

export type ForumGroupRole = "member" | "moderator";

/** Group summary as the directory list returns it. Includes the
 *  viewer's own membership so the UI can render "joined" / "locked"
 *  / "private" cards without a second round-trip. */
export type ForumGroup = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isPrivate: boolean;
  memberCount: number;
  threadCount: number;
  /** True when the requesting user is a member of this group. */
  isMember: boolean;
  /** Their role in the group, if any. */
  myRole: ForumGroupRole | null;
};

/** Embedded group reference inside thread payloads. */
export type ForumThreadGroupRef = {
  id: string;
  slug: string;
  name: string;
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
  group: ForumThreadGroupRef | null;
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

/* ---------- Client-side mutators (BRD §6.8) ---------- */

export type CreateThreadPayload = {
  title: string;
  body: string;
  groupId: string;
};

/** POST /forum/threads. Server enforces group membership for fellows. */
export async function createForumThread(
  payload: CreateThreadPayload,
): Promise<ForumThread> {
  const data = await apiFetch<{ thread: ForumThread }>("/forum/threads", {
    method: "POST",
    body: {
      title: payload.title,
      body: payload.body,
      groupId: payload.groupId,
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

/** GET /forum/groups — list groups visible to the current user. */
export async function listForumGroups(): Promise<ForumGroup[]> {
  const data = await apiFetch<{ groups: ForumGroup[] }>("/forum/groups");
  return data.groups;
}

/* ---------- Group chat (flat messages — replaces threads in the new UI) ---------- */

export type ForumMessageAuthor = {
  id: string;
  fullName: string;
  role: "fellow" | "mentor" | "faculty" | "admin" | "super_admin";
};

export type ForumMessage = {
  id: string;
  body: string;
  createdAt: string;
  author: ForumMessageAuthor;
};

/** GET /forum/groups/:id/messages — recent messages, oldest-first. */
export async function listForumMessages(
  groupId: string,
): Promise<ForumMessage[]> {
  const data = await apiFetch<{ messages: ForumMessage[] }>(
    `/forum/groups/${encodeURIComponent(groupId)}/messages`,
  );
  return data.messages;
}

/** POST /forum/groups/:id/messages — send a message. */
export async function sendForumMessage(
  groupId: string,
  body: string,
): Promise<ForumMessage> {
  const data = await apiFetch<{ message: ForumMessage }>(
    `/forum/groups/${encodeURIComponent(groupId)}/messages`,
    { method: "POST", body: { body } },
  );
  return data.message;
}

/* ---------- Admin-only mutators ---------- */

export type CreateGroupPayload = {
  name: string;
  slug?: string;
  description?: string;
  isPrivate?: boolean;
};

export async function createForumGroup(
  payload: CreateGroupPayload,
): Promise<ForumGroup> {
  const data = await apiFetch<{ group: ForumGroup }>("/forum/groups", {
    method: "POST",
    body: payload,
  });
  return data.group;
}

export type UpdateGroupPayload = {
  name?: string;
  description?: string;
  isPrivate?: boolean;
};

export async function updateForumGroup(
  id: string,
  payload: UpdateGroupPayload,
): Promise<ForumGroup> {
  const data = await apiFetch<{ group: ForumGroup }>(
    `/forum/groups/${encodeURIComponent(id)}`,
    { method: "PATCH", body: payload },
  );
  return data.group;
}

export async function deleteForumGroup(id: string): Promise<void> {
  await apiFetch(`/forum/groups/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function addForumGroupMember(
  groupId: string,
  userId: string,
  role: ForumGroupRole = "member",
): Promise<void> {
  await apiFetch(
    `/forum/groups/${encodeURIComponent(groupId)}/members`,
    { method: "POST", body: { userId, role } },
  );
}

export async function removeForumGroupMember(
  groupId: string,
  userId: string,
): Promise<void> {
  await apiFetch(
    `/forum/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
}
