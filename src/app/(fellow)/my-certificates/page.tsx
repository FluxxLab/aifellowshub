import type { Metadata } from "next";
import MyCertificatesView from "@/components/fellow/MyCertificatesView";
import CertificationScorecardCard from "@/components/fellow/CertificationScorecardCard";
import {
  getMyCertificateStateServer,
  getMyCertificationServer,
} from "@/lib/api/fellow-certificates.server";

export const metadata: Metadata = {
  title: "My certificates · AI Fellows LMS",
  description:
    "Your AI Fellowship completion certificate. Auto-issued when you complete the curriculum, your capstone is approved, and you attend the closing summit (BRD §6.6).",
};

export default async function MyCertificatesPage() {
  const [state, scorecard] = await Promise.all([
    getMyCertificateStateServer(),
    getMyCertificationServer(),
  ]);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {scorecard && <CertificationScorecardCard scorecard={scorecard} />}
      <MyCertificatesView state={state} />
    </div>
  );
}
