"use client";
import React, { useRef, useState } from "react";
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
  const canvasRef = useRef<HTMLDivElement | null>(null);
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
    if (!canvasRef.current || downloading) return;
    setDownloading(true);
    try {
      // Dynamic import keeps these out of the initial bundle — they
      // only load when the fellow actually clicks Download.
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(canvasRef.current, {
        // 3x scale renders at print quality (~300 DPI when the on-
        // screen canvas is ~800px wide). Higher than 3x costs memory
        // without visibly improving the result on most devices.
        scale: 3,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      // A4 landscape: 297mm × 210mm. The canvas aspect ratio is the
      // same (1.414:1), so the image fills the page exactly with no
      // letterboxing. PNG keeps the decorative detail lossless — JPEG
      // smudged the rosette petals and the woven floral border.
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
      pdf.save(`${c.fellowName.replace(/\s+/g, "_")}_Certificate_${c.id}.pdf`);
    } catch (err) {
      toast.errorFromException("Couldn't generate PDF", err);
    } finally {
      setDownloading(false);
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
            <Button
              size="sm"
              variant="outline"
              onClick={onDownload}
              disabled={downloading}
            >
              <DownloadIcon className="h-4 w-4" />
              {downloading ? "Preparing…" : "Download PDF"}
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

      <div ref={canvasRef}>
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
      </div>
    </>
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
          style={{ fontSize: "clamp(1.5rem, 4vw, 3rem)" }}
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

/* ---------- Shared decorative pieces (mirrors CertificatePreview) ---------- */

