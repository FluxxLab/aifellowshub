/**
 * Server-only fellow certificate fetcher (BRD §6.6). Reads the real
 * backend-issued certificate (if any) and maps to the existing
 * `FellowCertificateState`. Eligibility/preview default to a not-yet-
 * eligible empty state until those domains move to the backend.
 */
import "server-only";
import { backendFetch, BACKEND_URL } from "./backend";
import type {
  Certificate,
  FellowCertificateState,
  PublicCertificate,
} from "./fellow-certificates";

type BackendCertificate = {
  id: string;
  certificateNumber: string;
  capstoneTitle: string | null;
  fellowNameAtIssue: string;
  programName: string;
  issuedAt: string;
  revokedAt: string | null;
};

const PROGRAM_NAME = "AI Ethics & Governance Fellowship";
const COHORT_NAME = "Cohort 2026";

const SIGNATORIES = [
  { name: "Ngozi Okonkwo", role: "Director, Policy Innovation Centre" },
  { name: "Sara Adekunle", role: "Programme Manager" },
];

const EMPTY_STATE: FellowCertificateState = {
  certificate: null,
  eligibility: {
    eligible: false,
    requirements: [
      {
        label: "Pass all 12 module assessments",
        met: false,
        detail: "Module-by-module pass/fail check.",
      },
      {
        label: "Capstone approved",
        met: false,
        detail: "Mentor approval at the final stage.",
      },
    ],
  },
  exampleVerifyUrl: "/certificates/sample/verify",
  preview: {
    fellowName: "",
    programmeName: PROGRAM_NAME,
    cohortName: COHORT_NAME,
    capstoneTitle: "",
  },
};

export async function getMyCertificateStateServer(): Promise<FellowCertificateState> {
  try {
    const res = await backendFetch("/me/certificates", { method: "GET" });
    if (!res.ok) return EMPTY_STATE;
    const data = (await res.json()) as { certificates: BackendCertificate[] };
    const cert = data.certificates?.[0];
    if (!cert) return EMPTY_STATE;
    return {
      certificate: mapBackendCertificate(cert),
      eligibility: { eligible: true, requirements: EMPTY_STATE.eligibility.requirements },
      exampleVerifyUrl: `/certificates/${cert.certificateNumber}/verify`,
      preview: {
        fellowName: cert.fellowNameAtIssue,
        programmeName: cert.programName,
        cohortName: COHORT_NAME,
        capstoneTitle: cert.capstoneTitle ?? "",
      },
    };
  } catch {
    return EMPTY_STATE;
  }
}

type BackendVerifyOk = {
  valid: true;
  certificateNumber: string;
  fellowName: string;
  capstoneTitle: string | null;
  programName: string;
  issuedAt: string;
};
type BackendVerifyFail =
  | { valid: false; reason: "not_found" }
  | { valid: false; reason: "revoked"; revokedAt: string; revokedReason: string | null };

export async function getPublicCertificateServer(
  serial: string,
): Promise<PublicCertificate | null> {
  try {
    // Public, shared, non-personalized data — a verification link gets
    // pasted into LinkedIn/email and re-fetched by anyone who clicks it.
    // Cache it in Next's Data Cache (keyed per serial) so those hits serve
    // from the edge instead of the backend. We bypass backendFetch here
    // because it hard-codes `cache: "no-store"` and forwards the viewer's
    // cookie — neither wanted for a public, cacheable endpoint.
    //
    // Tradeoff: a freshly-revoked certificate can read "valid" for up to
    // the revalidate window. Revocation is rare and 5 min is an acceptable
    // lag for a credential page; shorten REVALIDATE if you need it tighter.
    const res = await fetch(
      `${BACKEND_URL}/certificates/${encodeURIComponent(serial)}/verify`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as BackendVerifyOk | BackendVerifyFail;
    if (!data.valid) return null;
    return {
      certificate: {
        id: data.certificateNumber,
        fellowName: data.fellowName,
        programmeName: data.programName,
        cohortName: COHORT_NAME,
        completedAt: data.issuedAt,
        issuedAt: data.issuedAt,
        capstoneTitle: data.capstoneTitle ?? "Untitled capstone",
        modulesCompleted: 12,
        totalModules: 12,
        signatories: SIGNATORIES,
      },
      verifiedAt: new Date().toISOString(),
      valid: true,
    };
  } catch {
    return null;
  }
}

function mapBackendCertificate(c: BackendCertificate): Certificate {
  return {
    id: c.certificateNumber,
    fellowName: c.fellowNameAtIssue,
    programmeName: c.programName,
    cohortName: COHORT_NAME,
    completedAt: c.issuedAt,
    issuedAt: c.issuedAt,
    capstoneTitle: c.capstoneTitle ?? "Untitled capstone",
    modulesCompleted: 12,
    totalModules: 12,
    signatories: SIGNATORIES,
  };
}
