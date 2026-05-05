/**
 * Certificates — public types (BRD §6.6). Reads run through
 * `fellow-certificates.server.ts`.
 *
 * Per project memory: certificates are template-driven, never uploaded.
 */

export type CertificateSignatory = {
  name: string;
  role: string;
};

export type Certificate = {
  /** Public certificate ID, used in /certificates/:id/verify. */
  id: string;
  fellowName: string;
  programmeName: string;
  cohortName: string;
  /** ISO date the cohort completed. */
  completedAt: string;
  /** ISO date the certificate was issued (once approved). */
  issuedAt: string;
  capstoneTitle: string;
  modulesCompleted: number;
  totalModules: number;
  signatories: CertificateSignatory[];
};

export type EligibilityRequirement = {
  label: string;
  met: boolean;
  detail: string;
};

export type FellowCertificateState = {
  /** Set if the certificate has been issued. */
  certificate: Certificate | null;
  /** Always present so the fellow can see what they're working toward. */
  eligibility: {
    eligible: boolean;
    requirements: EligibilityRequirement[];
  };
  /** A worked example public verification URL fellows can preview. */
  exampleVerifyUrl: string;
  /** Preview values used to render a sample certificate before issuance. */
  preview: {
    fellowName: string;
    programmeName: string;
    cohortName: string;
    capstoneTitle: string;
  };
};

export type PublicCertificate = {
  certificate: Certificate;
  /** ISO timestamp the verification was generated. */
  verifiedAt: string;
  /** True if the cert is still valid (not revoked). */
  valid: boolean;
};

