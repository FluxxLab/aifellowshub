import type { Metadata } from "next";
import CertificatesView from "@/components/admin/certificates/CertificatesView";
import {
  getCertificateTemplateServer,
  getIssuedCertificatesServer,
} from "@/lib/api/certificates.server";

export const metadata: Metadata = {
  title: "Certificates · AI Fellows LMS",
  description:
    "Manage the certificate template and view issued certificates (BRD §6.6). Auto-generated from a template — never uploaded.",
};

export default async function CertificatesPage() {
  const [template, issued] = await Promise.all([
    getCertificateTemplateServer(),
    getIssuedCertificatesServer(),
  ]);

  return <CertificatesView template={template} issued={issued} />;
}
