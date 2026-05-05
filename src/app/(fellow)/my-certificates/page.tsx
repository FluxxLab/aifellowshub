import type { Metadata } from "next";
import MyCertificatesView from "@/components/fellow/MyCertificatesView";
import { getMyCertificateStateServer } from "@/lib/api/fellow-certificates.server";

export const metadata: Metadata = {
  title: "My certificates · AI Fellows LMS",
  description:
    "Your AI Fellowship completion certificate. Auto-issued when you complete the curriculum, your capstone is approved, and you attend the closing summit (BRD §6.6).",
};

export default async function MyCertificatesPage() {
  const state = await getMyCertificateStateServer();
  return <MyCertificatesView state={state} />;
}
