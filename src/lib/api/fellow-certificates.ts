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

/**
 * The fellow's live certification scorecard (`GET /me/certification`) — the
 * authoritative answer to "why isn't my certificate issued yet?".
 * `missingRequirements` is a ready-to-render list of what's still outstanding;
 * it's empty exactly when `eligible` is true. Mirrors the backend's
 * CertificationsService.computeFellow return shape.
 */
export type CertificationScorecard = {
  totalScore: number;
  eligible: boolean;
  tier: "certified" | "merit" | "distinction" | null;
  missingRequirements: string[];
  criteria: {
    passingThreshold: number;
    requiredPostQuizzes: number;
    requiredSessions: number;
  };
  breakdown: {
    postQuizzes: {
      completed: number;
      required: number;
      averageScore: number;
      contribution: number;
    };
    participation: {
      /** Score-weighted credits: live = 1, recording = 0.5. */
      attendedSessions: number;
      /** What the eligibility gate counts: live and recording both = 1. */
      sessionsCovered: number;
      requiredSessions: number;
      attendanceRate: number;
      contribution: number;
    };
    assignments: {
      completed: number;
      averageScore: number;
      contribution: number;
    };
    capstone: {
      status: "approved" | "in_progress" | "not_started";
      contribution: number;
    };
    /** Pass/fail graduation gate — not a weighted component. */
    endlineSurvey?: {
      submitted: boolean;
      submittedAt: string | null;
    };
    /** Also pass/fail. `required` counts only modules the fellow attended. */
    moduleFeedback?: {
      submitted: number;
      required: number;
    };
  };
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

