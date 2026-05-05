import type { Metadata } from "next";
import ProfileView from "@/components/user/ProfileView";
import { getMyProfile } from "@/lib/api/profile.server";

export const metadata: Metadata = {
  title: "My profile · AI Fellows LMS",
  description:
    "Edit your fellowship profile, sector, bio, and notification preferences (BRD §6.1, §6.11).",
};

export default async function MyProfilePage() {
  const profile = await getMyProfile();
  return <ProfileView initial={profile} />;
}
