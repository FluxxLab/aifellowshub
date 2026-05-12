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

      // Load the template PNG and get a data URL for jsPDF.
      const templateUrl = "/images/Certificate%20lms.png";
      const dataUrl = await loadImageAsDataUrl(templateUrl);

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, PAGE_W, PAGE_H);

      // Fellow name — navy, above the orange rule. The rule sits at
      // roughly 60% of the page height = 126mm; baseline the text
      // a touch above so it doesn't overlap. Size kept modest so
      // even long names fit between the template's side flourishes.
      pdf.setTextColor(30, 58, 138);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.text(c.fellowName, PAGE_W / 2 + 26, 122, { align: "center" });

      // Signatory name — italic, above the "Authorized Signature" line.
      if (c.signatories?.[0]?.name) {
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(14);
        pdf.text(c.signatories[0].name, 95, 184, { align: "center" });
      }

      // Date — plain, above the "Date of Completion" line.
      if (c.completedAt) {
        const dateLabel = new Date(c.completedAt).toLocaleDateString(undefined, {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        pdf.text(dateLabel, 252, 184, { align: "center" });
      }

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
              { day: "numeric", month: "long", year: "numeric" },
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
      <Image
        src="/images/Certificate%20lms.png"
        alt=""
        fill
        priority
        // Bypass Next's WebP-resize optimisation so we serve the
        // original PNG bytes. The certificate has fine decorative
        // detail (rosette petals, woven floral motif) that softens
        // badly under transcoding.
        unoptimized
        quality={100}
        sizes="(max-width: 1024px) 100vw, 1024px"
        className="object-cover"
      />

      {/* Fellow name — sits above the orange rule on the template (~60% from top) */}
      <div
        className="absolute flex justify-center"
        style={{ top: "48%", left: "20%", right: "8%" }}
      >
        <p
          className="font-signature text-fellowship-navy leading-none"
          style={{ fontSize: "clamp(0.875rem, 2.2vw, 1.75rem)" }}
        >
          {fellowName}
        </p>
      </div>

      {/* Signature — above "Authorized Signature" label on the template */}
      <div
        className="absolute"
        style={{ bottom: "13%", left: "32%" }}
      >
        {primarySig && (
          <p
            className="font-signature text-fellowship-navy leading-none"
            style={{ fontSize: "clamp(0.9rem, 1.8vw, 1.4rem)" }}
          >
            {primarySig.name}
          </p>
        )}
      </div>

      {/* Date — above "Date of Completion" label on the template */}
      <div
        className="absolute text-right"
        style={{ bottom: "13%", right: "10%" }}
      >
        {completedAtLabel && (
          <p
            className="text-fellowship-navy leading-none"
            style={{ fontSize: "clamp(0.75rem, 1.4vw, 1rem)" }}
          >
            {completedAtLabel}
          </p>
        )}
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

