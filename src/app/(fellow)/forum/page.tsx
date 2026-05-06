import type { Metadata } from "next";
import ForumView from "@/components/fellow/ForumView";
import {
  getForumGroupsServer,
  getForumThreadsServer,
} from "@/lib/api/fellow-forum.server";

export const metadata: Metadata = {
  title: "Forum · AI Fellows LMS",
  description:
    "Cohort discussion — module questions, capstone scoping, meetups (BRD §6.8).",
};

export default async function ForumPage() {
  // Fetch groups + threads in parallel — both are independent reads.
  // Threads are scoped to the fellow's memberships server-side, so we
  // don't need to filter again here.
  const [groups, threads] = await Promise.all([
    getForumGroupsServer(),
    getForumThreadsServer(),
  ]);
  return <ForumView threads={threads} groups={groups} />;
}
