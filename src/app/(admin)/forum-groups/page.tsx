import type { Metadata } from "next";
import ForumGroupsView from "@/components/admin/forum/ForumGroupsView";
import { getForumGroupsServer } from "@/lib/api/fellow-forum.server";
import { getParticipantsServer } from "@/lib/api/participants.server";

export const metadata: Metadata = {
  title: "Forum groups · Admin",
  description: "Create channels and manage who can post in them.",
};

export default async function ForumGroupsPage() {
  const [groups, participants] = await Promise.all([
    getForumGroupsServer(),
    getParticipantsServer(),
  ]);

  // Flatten participants into a single user list the picker can search
  // across roles. The forum doesn't care whether someone is a fellow
  // or a faculty — it just needs to add user IDs to groups.
  const users = [
    ...participants.fellows.map((f) => ({
      id: f.id,
      fullName: f.fullName,
      email: f.email,
      role: "fellow" as const,
    })),
    ...participants.mentors.map((m) => ({
      id: m.id,
      fullName: m.fullName,
      email: m.email,
      role: "mentor" as const,
    })),
    ...participants.faculty.map((f) => ({
      id: f.id,
      fullName: f.fullName,
      email: f.email,
      role: "faculty" as const,
    })),
    ...participants.admins.map((a) => ({
      id: a.id,
      fullName: a.fullName,
      email: a.email,
      role: "admin" as const,
    })),
  ];

  return <ForumGroupsView initialGroups={groups} users={users} />;
}
