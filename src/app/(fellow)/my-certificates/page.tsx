import type { Metadata } from "next";
import MyCertificatesView from "@/components/fellow/MyCertificatesView";
import CertificatesTour from "@/components/fellow/tours/CertificatesTour";
import { getMyCertificateStateServer } from "@/lib/api/fellow-certificates.server";

export const metadata: Metadata = {
  title: "My certificates · AI Fellows LMS",
  description:
    "Your AI Fellowship completion certificate. Auto-issued when you complete the curriculum and your capstone is approved.",
};

export default async function MyCertificatesPage() {
  const state = await getMyCertificateStateServer();
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <CertificatesTour />
      <MyCertificatesView state={state} />
    </div>
  );
}
