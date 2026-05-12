"use client";
import React, { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import {
  CopyIcon,
  DownloadIcon,
  PaperPlaneIcon,
} from "@/icons";
import type {
  Certificate,
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
      <div data-tour="certificate-heading">
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
  // Eligibility checklist intentionally omitted — the scorecard above
  // already lists missing requirements. Keep the preview + verification
  // example so fellows still see what they're working toward.
  return (
    <>
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
/**
 * Fellowship certificate canvas — matches the brand-approved mockup:
 * patterned left/right blue borders, yellow rosette on the left,
 * Luminate wordmark + PIC×AHFID lockup at the top, "Certificate OF
 * COMPLETION" heading, fellow name above an amber rule, body text,
 * and a dual signature/date footer.
 *
 * Shared between the fellow's own page (`isPreview=true` overlays a
 * watermark) and the public verify page. The admin template-editor
 * uses a parallel component (`CertificatePreview`) with the same
 * visual language but template-driven copy.
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
  const primarySig = signatories?.[0];
  return (
    <article
      className="relative aspect-[1.414/1] w-full overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-fellowship-navy/10"
      aria-label={`${programmeName} certificate for ${fellowName}`}
    >
      <CertLeftBorder />
      <CertRightBorder />

      <div className="absolute inset-y-0 left-[18%] right-[5%] flex flex-col px-[3%] py-[5%]">
        {/* Top: Luminate wordmark + PIC × AHFID lockup */}
        <header className="flex items-start justify-between gap-6">
          <div className="font-bold tracking-tight text-gray-900 text-[clamp(1rem,2.4vw,1.75rem)]">
            luminate
          </div>
          <CertLogoLockup />
        </header>

        {/* Heading */}
        <div className="mt-[4%] text-center">
          <h1 className="font-extrabold text-fellowship-navy tracking-tight leading-[0.95] text-[clamp(2rem,7vw,5rem)]">
            Certificate
          </h1>
          <p className="mt-1 font-bold text-fellowship-navy tracking-[0.18em] text-[clamp(0.75rem,1.6vw,1.1rem)]">
            OF COMPLETION
          </p>
        </div>

        {/* Lead-in + fellow name + divider */}
        <div className="mt-[3%] flex flex-col items-center text-center">
          <p className="text-fellowship-navy text-[clamp(0.75rem,1.4vw,1rem)]">
            This is to certify that
          </p>
          <div className="mt-[3%] flex w-[80%] flex-col items-center">
            <p
              className="font-signature text-fellowship-navy text-[clamp(1.25rem,3.5vw,2.5rem)] leading-none"
              style={{ minHeight: "1em" }}
            >
              {fellowName}
            </p>
            <div className="mt-[2%] h-[2px] w-full bg-warning-500/80" />
          </div>
        </div>

        {/* Body paragraph */}
        <p className="mt-[3%] text-center text-fellowship-navy text-[clamp(0.75rem,1.4vw,1rem)] leading-relaxed">
          has successfully participated in and completed the {programmeName}
          {cohortName && cohortName !== programmeName ? ` (${cohortName})` : ""}.
          {capstoneTitle && (
            <span className="mt-2 block text-[clamp(0.65rem,1.2vw,0.9rem)] italic text-gray-600">
              Capstone: &ldquo;{capstoneTitle}&rdquo;
            </span>
          )}
        </p>

        {/* Footer: signature + date lines */}
        <div className="mt-auto flex items-end justify-between gap-8 pt-[3%]">
          <div className="flex flex-col items-start">
            <div className="h-px w-[clamp(8rem,18vw,15rem)] bg-fellowship-navy/70" />
            <span className="mt-1 text-fellowship-navy text-[clamp(0.65rem,1.1vw,0.85rem)]">
              Authorized Signature
            </span>
            {primarySig && (
              <span className="mt-0.5 text-[clamp(0.55rem,0.9vw,0.7rem)] text-gray-500">
                {primarySig.name} · {primarySig.role}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end">
            <div className="h-px w-[clamp(8rem,18vw,15rem)] bg-fellowship-navy/70" />
            <span className="mt-1 text-fellowship-navy text-[clamp(0.65rem,1.1vw,0.85rem)]">
              Date of Completion
            </span>
            {completedAtLabel && (
              <span className="mt-0.5 text-[clamp(0.55rem,0.9vw,0.7rem)] text-gray-500">
                {completedAtLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {isPreview && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span
            className="rotate-[-18deg] text-6xl font-bold tracking-widest text-fellowship-navy/[0.06] sm:text-8xl"
            style={{ letterSpacing: "0.3em" }}
          >
            PREVIEW
          </span>
        </div>
      )}
    </article>
  );
}

/* ---------- Shared decorative pieces (mirrors CertificatePreview) ---------- */

function CertLeftBorder() {
  return (
    <div className="absolute inset-y-0 left-0 w-[18%]">
      <div
        className="absolute inset-y-0 left-0 w-[70%] opacity-90"
        style={{
          backgroundColor: "#eef2ff",
          backgroundImage:
            "radial-gradient(circle at 50% 25%, #3b4eb0 22%, transparent 23%), radial-gradient(circle at 50% 75%, #3b4eb0 22%, transparent 23%)",
          backgroundSize: "40% 30%",
          backgroundPosition: "center",
          backgroundRepeat: "repeat",
        }}
      />
      <div
        className="absolute inset-y-0 left-[70%] w-[30%]"
        style={{
          backgroundColor: "#1e3a8a",
          backgroundImage:
            "linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.85) 50%), linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.85) 50%)",
          backgroundSize: "100% 18px",
          backgroundPosition: "0 0, 0 9px",
          backgroundRepeat: "repeat-y",
        }}
      />
      <div className="absolute left-[55%] top-0 h-full w-[6%] bg-blue-700" />
      <CertRosette />
    </div>
  );
}

function CertRightBorder() {
  return (
    <div
      className="absolute inset-y-0 right-0 w-[3%]"
      style={{
        backgroundColor: "#1e3a8a",
        backgroundImage:
          "linear-gradient(225deg, transparent 50%, rgba(255,255,255,0.85) 50%), linear-gradient(315deg, transparent 50%, rgba(255,255,255,0.85) 50%)",
        backgroundSize: "100% 18px",
        backgroundPosition: "0 0, 0 9px",
        backgroundRepeat: "repeat-y",
      }}
    />
  );
}

function CertRosette() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 120 200"
      className="absolute left-[35%] top-1/2 h-[35%] w-auto -translate-y-1/2"
      style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.15))" }}
    >
      <polygon points="42,100 42,190 60,170 78,190 78,100" fill="#1e3a8a" />
      <polygon points="42,100 42,160 50,150 50,100" fill="#3b4eb0" />
      <polygon points="78,100 78,160 70,150 70,100" fill="#3b4eb0" />
      <circle cx="60" cy="65" r="48" fill="#f5a623" />
      <g fill="#f5a623">
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * 360;
          const rad = (a * Math.PI) / 180;
          const cx = 60 + Math.cos(rad) * 48;
          const cy = 65 + Math.sin(rad) * 48;
          return <circle key={i} cx={cx} cy={cy} r="6" />;
        })}
      </g>
      <circle cx="60" cy="65" r="30" fill="#fbbf24" />
      <circle cx="60" cy="65" r="25" fill="none" stroke="#f5a623" strokeWidth="2" />
    </svg>
  );
}

function CertLogoLockup() {
  return (
    <div className="flex items-center gap-2 text-fellowship-navy">
      <span className="text-[clamp(0.7rem,1.5vw,1rem)] font-bold tracking-tight">
        PIC
      </span>
      <span className="h-6 w-px bg-fellowship-navy/40" />
      <span className="text-[clamp(0.55rem,1vw,0.75rem)] font-bold leading-tight tracking-tight text-error-600">
        AFRICA HUB FOR
        <br />
        INNOVATION &amp;
        <br />
        DEVELOPMENT
      </span>
    </div>
  );
}
