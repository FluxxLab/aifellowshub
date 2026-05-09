import type { Metadata } from "next";
import ForumChat from "@/components/forum/ForumChat";
import { getForumGroupsServer } from "@/lib/api/fellow-forum.server";

export const metadata: Metadata = {
  title: "Forum · AI Fellows LMS",
  description:
    "Cohort discussion — chat with fellows, mentors, and admins in your groups (BRD §6.8).",
};

export default async function ForumPage() {
  const groups = await getForumGroupsServer();
  return <ForumChat groups={groups} />;
}
