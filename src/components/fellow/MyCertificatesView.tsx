"use client";
import React, { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import {
  CheckLineIcon,
  CopyIcon,
  DownloadIcon,
  PaperPlaneIcon,
  ShootingStarIcon,
} from "@/icons";
import type {
  Certificate,
  EligibilityRequirement,
  FellowCertificateState,
} from "@/lib/api/fellow-certificates";

/**
 * Fellow's certificate page (BRD §6.6).
 *
 * Phase 1: state is whatever the mock returns.
 * Phase 2: GET /certificates/me; once eligibility flips, the system renders
 * the cert from the active template and exposes the public verify URL.
 */
export default function MyCertificatesView({
  state,
}: {
  state: FellowCertificateState;
}) {
  const issued = state.certificate !== null;
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Certificate" },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          My certificate
        </h1>
        <p className="mt-2 max-w-3xl text-gray-600">
          Your Fellowship certificate is auto-issued when you finish the
          curriculum, your capstone is approved, and you attend the closing
          summit. Each certificate has a public verification URL anyone can
          use — no login required.
        </p>
      </div>

      {issued ? (
        <IssuedView certificate={state.certificate!} />
      ) : (
        <PendingView state={state} />
      )}
    </div>
  );
}

function PendingView({ state }: { state: FellowCertificateState }) {
  const met = state.eligibility.requirements.filter((r) => r.met).length;
  const total = state.eligibility.requirements.length;

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge color="warning" variant="light">
              Not yet issued
            </Badge>
            <h2 className="mt-2 text-xl font-semibold text-gray-800">
              You&apos;re {met} of {total} requirements in
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Once all three are met, your certificate is generated automatically
              and a public verify URL becomes available.
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-3">
          {state.eligibility.requirements.map((r) => (
            <RequirementRow key={r.label} requirement={r} />
          ))}
        </ul>
      </section>

      <CertificatePreview state={state} />

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5 md:p-6">
        <h3 className="text-base font-semibold text-gray-800">
          What public verification looks like
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          When your certificate is issued, anyone with the link can verify it
          without an account — useful for adding to LinkedIn, job applications,
          or proposals. Here&apos;s a worked example you can open now:
        </p>
        <Link
          href={state.exampleVerifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block"
        >
          <Button size="sm" variant="outline">
            See a sample verification page
          </Button>
        </Link>
      </section>
    </>
  );
}

function RequirementRow({ requirement: r }: { requirement: EligibilityRequirement }) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white p-3 text-sm">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          r.met
            ? "bg-success-100 text-success-600"
            : "border-2 border-gray-200 bg-white"
        }`}
      >
        {r.met && <CheckLineIcon className="h-3 w-3" />}
      </span>
      <div className="flex-1">
        <p
          className={`font-medium ${
            r.met ? "text-gray-500 line-through" : "text-gray-800"
          }`}
        >
          {r.label}
        </p>
        <p className="text-xs text-gray-500">{r.detail}</p>
      </div>
    </li>
  );
}

function CertificatePreview({ state }: { state: FellowCertificateState }) {
  return (
    <section className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Preview · what your certificate will look like
        </p>
        <Badge color="light" variant="light">
          Preview only
        </Badge>
      </div>
      <div className="mt-4">
        <CertificateCanvas
          fellowName={state.preview.fellowName}
          programmeName={state.preview.programmeName}
          cohortName={state.preview.cohortName}
          capstoneTitle={state.preview.capstoneTitle}
          completedAtLabel={null}
          isPreview
        />
      </div>
    </section>
  );
}

function IssuedView({ certificate: c }: { certificate: Certificate }) {
  const [copied, setCopied] = useState(false);
  const verifyPath = `/certificates/${c.id}/verify`;
  const verifyUrl =
    typeof window !== "undefined" ? `${window.location.origin}${verifyPath}` : verifyPath;

  const onCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <>
      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Badge color="success">Issued</Badge>
            <h2 className="mt-2 text-xl font-semibold text-gray-800">
              Your Fellowship certificate
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Issued {new Date(c.issuedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })} ·{" "}
              ID <span className="font-mono">{c.id}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline">
              <DownloadIcon className="h-4 w-4" />
              Download PDF
            </Button>
            <Button size="sm" variant="fellowship">
              <PaperPlaneIcon className="h-4 w-4" />
              Share to LinkedIn
            </Button>
          </div>
        </div>

        <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Public verification URL
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Link
              href={verifyPath}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-fellowship-navy hover:underline"
            >
              {verifyUrl}
            </Link>
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
            >
              <CopyIcon className="h-3.5 w-3.5" />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Anyone with this link can verify your certificate — no login required.
          </p>
        </div>
      </section>

      <CertificateCanvas
        fellowName={c.fellowName}
        programmeName={c.programmeName}
        cohortName={c.cohortName}
        capstoneTitle={c.capstoneTitle}
        completedAtLabel={new Date(c.completedAt).toLocaleDateString(undefined, {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
        signatories={c.signatories}
        isPreview={false}
      />
    </>
  );
}

/**
 * Renders the certificate visual. Used both for the preview (Amara, before
 * issuance) and the issued state. Phase 2: same component renders inside the
 * PDF generation pipeline so what the fellow sees == what they download.
 */
export function CertificateCanvas({
  fellowName,
  programmeName,
  cohortName,
  capstoneTitle,
  completedAtLabel,
  signatories,
  isPreview,
}: {
  fellowName: string;
  programmeName: string;
  cohortName: string;
  capstoneTitle: string;
  completedAtLabel: string | null;
  signatories?: { name: string; role: string }[];
  isPreview: boolean;
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-fellowship-navy/10 ${
        isPreview ? "" : ""
      }`}
      aria-label={`${programmeName} certificate for ${fellowName}`}
    >
      {/* Gold border bands top and bottom */}
      <div className="h-3 bg-gradient-to-r from-warning-400 via-warning-500 to-warning-400" />
      <div className="px-8 py-10 sm:px-12 sm:py-14">
        <div className="text-center">
          <ShootingStarIcon className="mx-auto h-10 w-10 text-warning-500" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-fellowship-navy">
            Certificate of Completion
          </p>
          <p className="mt-1 text-sm font-medium tracking-wide text-gray-500">
            {programmeName}
          </p>

          <p className="mt-8 text-sm text-gray-500">This is to certify that</p>
          <h2
            className="mt-2 font-bold text-fellowship-navy"
            style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
          >
            {fellowName}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-600">
            successfully completed all twelve modules of the{" "}
            <span className="font-semibold text-gray-800">{cohortName}</span>{" "}
            and produced an approved capstone titled
          </p>
          <p className="mt-3 text-base font-semibold italic text-gray-800">
            &ldquo;{capstoneTitle}&rdquo;
          </p>

          {completedAtLabel && (
            <p className="mt-6 text-xs text-gray-500">
              Completed {completedAtLabel}
            </p>
          )}
        </div>

        {signatories && signatories.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {signatories.map((s) => (
              <div key={s.name} className="text-center">
                <p
                  className="border-b border-gray-300 pb-2 font-serif text-lg italic text-gray-700"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {s.name}
                </p>
                <p className="mt-1 text-xs text-gray-500">{s.role}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="h-3 bg-gradient-to-r from-warning-400 via-warning-500 to-warning-400" />

      {isPreview && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span
            className="rotate-[-18deg] text-6xl font-bold tracking-widest text-fellowship-navy/8 sm:text-8xl"
            style={{ letterSpacing: "0.3em" }}
          >
            PREVIEW
          </span>
        </div>
      )}
    </article>
  );
}
