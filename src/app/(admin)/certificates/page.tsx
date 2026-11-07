import type { Metadata } from "next";
import CertificatesView from "@/components/admin/certificates/CertificatesView";
import {
  getCertificateTemplateServer,
  getIssuedCertificatesServer,
} from "@/lib/api/certificates.server";
import { getParticipantsServer } from "@/lib/api/participants.server";

export const metadata: Metadata = {
  title: "Certificates · AI Fellows LMS",
  description:
    "Manage the certificate template and view issued certificates (BRD §6.6). Auto-generated from a template — never uploaded.",
};

export default async function CertificatesPage() {
  const [template, issued, participants] = await Promise.all([
    getCertificateTemplateServer(),
    getIssuedCertificatesServer(),
    getParticipantsServer(),
  ]);

  // Only what the "Issue manually" picker needs.
  const fellows = participants.fellows.map((f) => ({
    id: f.id,
    fullName: f.fullName,
    email: f.email,
  }));

  return (
    <CertificatesView template={template} issued={issued} fellows={fellows} />
  );
}
