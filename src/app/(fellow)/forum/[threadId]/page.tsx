import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ForumThreadView from "@/components/fellow/ForumThreadView";
import { getForumThreadServer } from "@/lib/api/fellow-forum.server";

export async function generateMetadata({
  params,
}: {
  params: { threadId: string };
}): Promise<Metadata> {
  const { threadId } = params;
  const thread = await getForumThreadServer(threadId);
  if (!thread) return { title: "Thread not found · AI Fellows LMS" };
  return {
    title: `${thread.title} · Forum · AI Fellows LMS`,
    description: thread.preview,
  };
}

export default async function ForumThreadPage({
  params,
}: {
  params: { threadId: string };
}) {
  const { threadId } = params;
  const thread = await getForumThreadServer(threadId);
  if (!thread) notFound();
  return <ForumThreadView thread={thread} />;
}
