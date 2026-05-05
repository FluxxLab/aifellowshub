import type { Metadata } from "next";
import MyCapstoneView from "@/components/fellow/MyCapstoneView";
import { getFellowCapstoneServer } from "@/lib/api/fellow-capstone.server";

export const metadata: Metadata = {
  title: "My capstone · AI Fellows LMS",
  description:
    "Your capstone draft, mentor feedback thread, milestones, and stakeholder consultations (BRD §6.10).",
};

export default async function MyCapstonePage() {
  const capstone = await getFellowCapstoneServer();
  return <MyCapstoneView capstone={capstone} />;
}
