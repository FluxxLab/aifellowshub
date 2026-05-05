/**
 * Certificates — admin types (BRD §6.6). The legacy admin certificate
 * page surfaces a richer template + listing shape than the backend
 * currently exposes. Real fellow-side certificate flows run through
 * `fellow-certificates.server.ts` (`/me/certificates`); admin listing
 * via `/certificates` is wired through `getIssuedCertificates` below
 * once the backend exposes it as the same shape.
 */

export type CertificateTemplate = {
  id: string;
  courseId: string;
  courseTitle: string;
  /** Heading on the certificate. */
  title: string;
  /** Interpolated body text. Supports {{fellow_name}}, {{course_title}}, {{issued_date}}. */
  bodyText: string;
  logoUrl: string | null;
  signatureUrl: string | null;
  signatoryName: string;
  signatoryTitle: string;
  backgroundUrl: string | null;
  isActive: boolean;
  updatedAt: string;
};

export type IssuedCertificate = {
  id: string;
  fellowId: string;
  fellowName: string;
  courseId: string;
  courseTitle: string;
  /** Unique, human-readable identifier (matches BRD §6.6 certificate_number). */
  certificateNumber: string;
  issuedAt: string;
  /** Public verification URL. */
  verifyUrl: string;
  isRevoked: boolean;
  revokedAt: string | null;
  revokedReason: string | null;
};

export async function getCertificateTemplate(): Promise<CertificateTemplate> {
  return {
    id: "tpl-default",
    courseId: "",
    courseTitle: "AI Ethics & Governance Fellowship · Cohort 2026",
    title: "Certificate of Completion",
    bodyText:
      "This is to certify that {{fellow_name}} has successfully completed {{course_title}} on {{issued_date}}.",
    logoUrl: null,
    signatureUrl: null,
    signatoryName: "Ngozi Okonkwo",
    signatoryTitle: "Director, Policy Innovation Centre",
    backgroundUrl: null,
    isActive: true,
    updatedAt: new Date().toISOString(),
  };
}

export async function getIssuedCertificates(): Promise<IssuedCertificate[]> {
  return [];
}
