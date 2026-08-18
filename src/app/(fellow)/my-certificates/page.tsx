import type { Metadata } from "next";
import MyCertificatesView from "@/components/fellow/MyCertificatesView";
import CertificatesTour from "@/components/fellow/tours/CertificatesTour";
import {
  getMyCertificateStateServer,
  getMyCertificationScorecardServer,
} from "@/lib/api/fellow-certificates.server";

export const metadata: Metadata = {
  title: "My certificates · AI Fellows LMS",
  description:
    "Your AI Fellowship completion certificate. Auto-issued when you complete the curriculum and upload your final capstone documentation.",
};

export default async function MyCertificatesPage() {
  // Fetched together — the scorecard explains *why* an unissued certificate is
  // still locked, so the page never shows a bare lock with no reason.
  const [state, scorecard] = await Promise.all([
    getMyCertificateStateServer(),
    getMyCertificationScorecardServer(),
  ]);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <CertificatesTour />
      <MyCertificatesView state={state} scorecard={scorecard} />
    </div>
  );
}
