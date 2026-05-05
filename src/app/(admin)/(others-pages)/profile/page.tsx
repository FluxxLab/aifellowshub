import type { Metadata } from "next";
import ProfileView from "@/components/user/ProfileView";
import { getMyProfile } from "@/lib/api/profile.server";

export const metadata: Metadata = {
  title: "Profile · AI Fellows LMS",
  description:
    "Edit your profile and notification preferences (BRD §6.1, §6.11).",
};

export default async function ProfilePage() {
  const profile = await getMyProfile();
  return <ProfileView initial={profile} />;
}
