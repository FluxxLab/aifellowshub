import type { Metadata } from "next";
import ForumView from "@/components/fellow/ForumView";
import { getForumThreadsServer } from "@/lib/api/fellow-forum.server";

export const metadata: Metadata = {
  title: "Forum · AI Fellows LMS",
  description:
    "Cohort discussion — module questions, capstone scoping, meetups (BRD §6.8).",
};

export default async function ForumPage() {
  const threads = await getForumThreadsServer();
  return <ForumView threads={threads} />;
}
