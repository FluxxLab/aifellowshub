/**
 * Server-only admin certificates fetcher (BRD §6.6). Maps the backend
 * `/certificates` aggregate + `/certificate-templates/default` to the
 * `CertificateTemplate` / `IssuedCertificate` shapes the admin page renders.
 */
import "server-only";
import { backendFetch } from "./backend";
import type { CertificateTemplate, IssuedCertificate } from "./certificates";

type BackendTemplate = {
  id: string;
  name: string;
  programName: string;
  htmlBody: string;
  signatures: unknown;
  isDefault: boolean;
  updatedAt: string;
};

type BackendIssued = {
  id: string;
  certificateNumber: string;
  capstoneTitle: string | null;
  fellow: { id: string; fullName: string; email: string } | null;
  template: { id: string; name: string };
  issuedAt: string;
  revokedAt: string | null;
  revokedReason: string | null;
};

const FALLBACK_TEMPLATE: CertificateTemplate = {
  id: "tpl-default",
  courseId: "",
  courseTitle: "AI Ethics & Governance Fellowship",
  title: "Certificate of Completion",
  bodyText:
    "This is to certify that {{fellow_name}} has successfully completed the Fellowship.",
  logoUrl: null,
  signatureUrl: null,
  signatoryName: "",
  signatoryTitle: "",
  backgroundUrl: null,
  isActive: true,
  updatedAt: new Date().toISOString(),
};

export async function getCertificateTemplateServer(): Promise<CertificateTemplate> {
  try {
    const res = await backendFetch("/certificate-templates/default", {
      method: "GET",
    });
    if (!res.ok) return FALLBACK_TEMPLATE;
    const data = (await res.json()) as { template: BackendTemplate | null };
    return data.template ? mapTemplate(data.template) : FALLBACK_TEMPLATE;
  } catch {
    return FALLBACK_TEMPLATE;
  }
}

export async function getIssuedCertificatesServer(): Promise<IssuedCertificate[]> {
  try {
    const res = await backendFetch("/certificates", { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as { certificates: BackendIssued[] };
    return (data.certificates ?? []).map(mapIssued);
  } catch {
    return [];
  }
}

function mapTemplate(t: BackendTemplate): CertificateTemplate {
  // Pull the first signer out of the JSON `signatures` array so the legacy
  // single-signatory fields render. Extra signers are preserved in the
  // backend record but not surfaced in this view.
  const sigs = Array.isArray(t.signatures)
    ? (t.signatures as { name?: string; role?: string; signatureUrl?: string }[])
    : [];
  const first = sigs[0] ?? {};
  return {
    id: t.id,
    courseId: "",
    courseTitle: t.programName,
    title: t.name,
    bodyText: t.htmlBody,
    logoUrl: null,
    signatureUrl: first.signatureUrl ?? null,
    signatoryName: first.name ?? "",
    signatoryTitle: first.role ?? "",
    backgroundUrl: null,
    isActive: t.isDefault,
    updatedAt: t.updatedAt,
  };
}

function mapIssued(c: BackendIssued): IssuedCertificate {
  return {
    id: c.id,
    fellowId: c.fellow?.id ?? "",
    fellowName: c.fellow?.fullName ?? "Unknown",
    courseId: c.template.id,
    courseTitle: c.template.name,
    certificateNumber: c.certificateNumber,
    issuedAt: c.issuedAt,
    verifyUrl: `/certificates/${encodeURIComponent(c.certificateNumber)}/verify`,
    isRevoked: c.revokedAt !== null,
    revokedAt: c.revokedAt,
    revokedReason: c.revokedReason,
  };
}
