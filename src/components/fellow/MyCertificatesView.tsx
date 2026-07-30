"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import { toast } from "@/lib/toast";
import {
  CopyIcon,
  DownloadIcon,
  LockIcon,
  PaperPlaneIcon,
} from "@/icons";
import type {
  Certificate,
  CertificationScorecard,
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
  scorecard = null,
}: {
  state: FellowCertificateState;
  /** Live eligibility scorecard; null if it couldn't be loaded. */
  scorecard?: CertificationScorecard | null;
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
          curriculum and your capstone is approved. Each certificate has a
          public verification URL anyone can use — no login required.
        </p>
      </div>

      {issued ? (
        <IssuedView certificate={state.certificate!} />
      ) : (
        <PendingView state={state} scorecard={scorecard} />
      )}
    </div>
  );
}

function PendingView({
  state,
  scorecard,
}: {
  state: FellowCertificateState;
  scorecard: CertificationScorecard | null;
}) {
  return (
    <>
      <CertificatePreview state={state} />

      {scorecard && !scorecard.eligible && scorecard.missingRequirements.length > 0 && (
        <RemainingRequirements scorecard={scorecard} />
      )}

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

/**
 * "What's still outstanding" — the live reasons the certificate hasn't issued,
 * straight from the backend scorecard. Without this the page showed a bare
 * lock, so a fellow who had (say) covered every session but was short one quiz
 * had no way to know what to do next, and staff had to read the server log to
 * find out. Only rendered when the fellow is genuinely ineligible.
 */
function RemainingRequirements({
  scorecard,
}: {
  scorecard: CertificationScorecard;
}) {
  const { breakdown, criteria, totalScore, missingRequirements } = scorecard;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <h3 className="text-base font-semibold text-gray-800">
        What&apos;s left before your certificate unlocks
      </h3>
      <ul className="mt-3 flex flex-col gap-2.5">
        {missingRequirements.map((requirement, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
            <span
              aria-hidden
              className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
            />
            <span>{requirement}</span>
          </li>
        ))}
      </ul>

      {/* Post-learning quizzes are intentionally absent — they no longer
          gate or score certification, so listing them here would read as an
          outstanding requirement. */}
      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-3">
        <Stat
          label="Overall score"
          value={`${totalScore}%`}
          hint={`Pass mark ${criteria.passingThreshold}%`}
        />
        <Stat
          label="Sessions covered"
          value={`${breakdown.participation.sessionsCovered ?? breakdown.participation.attendedSessions}/${breakdown.participation.requiredSessions}`}
          hint="Live or recording"
        />
        <Stat
          label="Capstone"
          value={
            breakdown.capstone.status === "approved"
              ? "Approved"
              : breakdown.capstone.status === "in_progress"
                ? "In progress"
                : "Not started"
          }
        />
      </dl>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-gray-800">{value}</dd>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

/**
 * Locked placeholder shown before the certificate is issued.
 *
 * Deliberately does NOT render the certificate artwork. The template carries
 * the Executive Director's and Managing Partner's real signatures, so showing
 * a filled-in "preview" to a fellow who hasn't earned it hands them a
 * screenshot that is indistinguishable from the real thing. Nothing signed is
 * rendered — or downloadable — until the certificate is actually issued.
 */
function CertificatePreview({ state }: { state: FellowCertificateState }) {
  return (
    <section className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Your certificate
        </p>
        <Badge color="light" variant="light">
          Not yet issued
        </Badge>
      </div>

      <div className="mt-4 flex aspect-[1.414/1] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200/70">
          <LockIcon className="h-7 w-7 text-gray-500" />
        </div>
        <p className="text-base font-semibold text-gray-700">
          Your certificate is locked
        </p>
        <p className="max-w-md text-sm text-gray-500">
          It unlocks automatically once you finish the curriculum and your
          capstone is approved. You&apos;ll be able to view, download, and share
          it from here the moment it&apos;s issued.
        </p>
        <p className="text-xs text-gray-400">
          Issued to {state.preview.fellowName} · {state.preview.programmeName}
        </p>
      </div>
    </section>
  );
}

function IssuedView({ certificate: c }: { certificate: Certificate }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
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

  const onDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      // Compose the PDF directly with jsPDF — embed the brand template
      // as a background image, then add the name/signature/date as
      // real PDF text. Much sharper and smaller than rasterising the
      // DOM via html2canvas, and the resulting PDF text is selectable.
      const { default: jsPDF } = await import("jspdf");

      // A4 landscape in mm.
      const PAGE_W = 297;
      const PAGE_H = 210;

      // Load the template image and get a data URL for jsPDF.
      const templateUrl = "/images/certificate-lms-v2.jpg";
      const dataUrl = await loadImageAsDataUrl(templateUrl);

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      // loadImageAsDataUrl re-encodes via canvas to a PNG data URL.
      pdf.addImage(dataUrl, "PNG", 0, 0, PAGE_W, PAGE_H);

      // Fellow name — the ONLY variable field. Sits on the blank line between
      // "This is to certify that" and the orange rule: ~48% down = ~105mm,
      // centred in the content area at ~60% of the width. The two signatures,
      // their titles, and the programme line are baked into the template image,
      // so nothing else is drawn. Kept in lockstep with CertificateCanvas.
      pdf.setTextColor(30, 58, 138);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.text(c.fellowName, PAGE_W * 0.6, 105, { align: "center" });

      pdf.save(`${c.fellowName.replace(/\s+/g, "_")}_Certificate_${c.id}.pdf`);
    } catch (err) {
      toast.errorFromException("Couldn't generate PDF", err);
    } finally {
      setDownloading(false);
    }
  };

  const onShareLinkedIn = () => {
    // LinkedIn's share-offsite endpoint reads the OG meta tags off
    // the verify page and builds the preview card itself. Open in a
    // popup so the fellow can write a post on top of the auto-card
    // without losing this tab.
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://aifellowshub.vercel.app";
    const target = `${origin}${verifyPath}`;
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      target,
    )}`;
    window.open(
      shareUrl,
      "linkedin-share",
      "width=720,height=640,noopener,noreferrer",
    );
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-8">
        {/* Left column — completion details + verify URL */}
        <div className="flex flex-col gap-4">
          <div>
            <Badge color="success">Issued</Badge>
            <h2 className="mt-2 text-2xl font-bold text-gray-800">
              Completed by {c.fellowName}
            </h2>
            <p className="mt-3 text-base font-semibold text-gray-700">
              {new Date(c.completedAt).toLocaleDateString(undefined, {
                timeZone: "Africa/Lagos",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              <span className="font-semibold text-gray-800">{c.fellowName}</span>
              &apos;s account is verified. The Policy Innovation Centre certifies
              their successful completion of{" "}
              <Link
                href={verifyPath}
                className="font-semibold text-fellowship-navy hover:underline"
              >
                {c.programmeName}
              </Link>
              .
            </p>
          </div>

          <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Public verification URL
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Link
                href={verifyPath}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-mono text-xs text-fellowship-navy hover:underline sm:text-sm"
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
              Anyone with this link can verify your certificate — no login
              required.
            </p>
          </div>

          <p className="text-xs text-gray-500">
            Certificate ID <span className="font-mono">{c.id}</span>
          </p>
        </div>

        {/* Right column — compact certificate preview + actions */}
        <div className="flex flex-col gap-3">
          <CertificateCanvas
            fellowName={c.fellowName}
            programmeName={c.programmeName}
            cohortName={c.cohortName}
            capstoneTitle={c.capstoneTitle}
            completedAtLabel={new Date(c.completedAt).toLocaleDateString(
              undefined,
              { timeZone: "Africa/Lagos", day: "numeric", month: "long", year: "numeric" },
            )}
            signatories={c.signatories}
            isPreview={false}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="fellowship"
              onClick={onShareLinkedIn}
            >
              <PaperPlaneIcon className="h-4 w-4" />
              Share to LinkedIn
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDownload}
              disabled={downloading}
            >
              <DownloadIcon className="h-4 w-4" />
              {downloading ? "Preparing…" : "Download PDF"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Renders the certificate visual. Used both for the preview (Amara, before
 * issuance) and the issued state. Phase 2: same component renders inside the
 * PDF generation pipeline so what the fellow sees == what they download.
 */
/**
 * Fellowship certificate canvas.
 *
 * Renders the brand-approved template image full-bleed and overlays
 * the variable fields (fellow name, signature, date) at calibrated
 * absolute positions. All decorative elements — borders, rosette,
 * logos, fixed copy ("Certificate of Completion", body paragraph,
 * field labels) — are baked into the template PNG.
 *
 * Template asset lives at `/public/images/certificate-template.png`.
 * If you change the template, re-calibrate the overlay positions
 * (top/left percentages) so the name, signature, and date land on
 * their respective lines.
 */
export function CertificateCanvas({
  fellowName,
  programmeName,
  isPreview,
}: {
  fellowName: string;
  programmeName: string;
  cohortName: string;
  capstoneTitle: string;
  // The new template bakes in the signatures, titles, programme line, and date,
  // so only `fellowName` is overlaid. These remain in the type for callers.
  completedAtLabel: string | null;
  signatories?: { name: string; role: string }[];
  isPreview: boolean;
}) {
  return (
    <article
      className="relative aspect-[1.414/1] w-full overflow-hidden rounded-2xl bg-white shadow-theme-sm ring-1 ring-fellowship-navy/10"
      aria-label={`${programmeName} certificate for ${fellowName}`}
    >
      <Image
        src="/images/certificate-lms-v2.jpg"
        alt=""
        fill
        priority
        // Bypass Next's WebP-resize optimisation so we serve the
        // original bytes. The certificate has fine decorative detail
        // (rosette petals, woven floral motif) that softens badly under
        // transcoding.
        unoptimized
        quality={100}
        sizes="(max-width: 1024px) 100vw, 1024px"
        className="object-cover"
      />

      {/* Fellow name — the only variable field, on the blank line between
          "This is to certify that" and the orange rule (~48% down, centred
          in the content area at ~60% width). Signatures + date are baked
          into the template image, so no overlays for them. Kept in lockstep
          with the jsPDF coordinates in onDownload above. */}
      <div
        className="absolute flex justify-center"
        style={{ top: "45.5%", left: "22%", right: "2%" }}
      >
        <p
          className="font-bold text-fellowship-navy leading-none"
          style={{ fontSize: "clamp(1rem, 2.6vw, 2rem)" }}
        >
          {fellowName}
        </p>
      </div>

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

/**
 * Fetch an image URL and return its bytes as a base64 data URL so
 * jsPDF can embed it. Goes through a hidden <canvas> rather than a
 * fetch() so that browser caching honours the same path the on-page
 * <Image> already loaded, and the crossOrigin attribute is set to
 * keep the canvas un-tainted in case anyone ever swaps the asset
 * for a remote URL.
 */
async function loadImageAsDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Couldn't get 2D context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

