import React from "react";
import Image from "next/image";
import type { CertificateTemplate } from "@/lib/api/certificates";

type CertificatePreviewProps = {
 template: CertificateTemplate;
 /** Sample fellow data used to populate the placeholders. */
 fellowName?: string;
 issuedDate?: string;
 certificateNumber?: string;
};

/**
 * AI Ethics & Governance Fellowship completion certificate.
 *
 * Visual design is fixed (matches the brand-approved mockup): two
 * patterned blue side borders, a yellow rosette anchored on the left
 * column, Luminate wordmark + PIC×AHFID lockup at the top, centred
 * heading, fellow name above a divider, body text, and the dual
 * signature / date footer.
 *
 * The text bits (`title`, `bodyText`, `signatoryName`, dates) still
 * come from the editable `CertificateTemplate` so admins can tune
 * copy without redesigning the canvas.
 */
export default function CertificatePreview({
 template,
 fellowName = "",
 issuedDate = "",
 certificateNumber,
}: CertificatePreviewProps) {
 const body = template.bodyText
 .replace(/\{\{fellow_name\}\}/g, fellowName || "the participant")
 .replace(/\{\{course_title\}\}/g, template.courseTitle)
 .replace(/\{\{issued_date\}\}/g, issuedDate || "—");

 return (
 <div className="relative aspect-[1.414/1] w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-md">
 {/* Decorative left border — wide patterned column with the rosette anchored mid-height */}
 <LeftBorder />
 {/* Decorative right border — thin triangular pattern only */}
 <RightBorder />

 {/* Content surface */}
 <div className="absolute inset-y-0 left-[18%] right-[5%] flex flex-col px-[3%] py-[5%]">
 {/* Top: Luminate wordmark + PIC × AHFID lockup */}
 <header className="flex items-start justify-between gap-6">
 <Image
 src="/images/luminatewhite.png"
 alt="Luminate"
 width={400}
 height={120}
 className="h-[clamp(1.5rem,3.5vw,2.75rem)] w-auto object-contain"
 />
 <Image
 src={template.logoUrl ?? "/images/white-logo.png"}
 alt="Policy Innovation Centre × Africa Hub for Innovation & Development"
 width={600}
 height={180}
 className="h-[clamp(2rem,4.5vw,3.5rem)] w-auto object-contain"
 />
 </header>

 {/* Heading */}
 <div className="mt-[4%] text-center">
 <h1 className="font-extrabold text-fellowship-navy tracking-tight leading-[0.95] text-[clamp(2rem,7vw,5rem)]">
 {template.title.split(" ")[0] || "Certificate"}
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
 {body}
 </p>

 {/* Footer: signature line + date line */}
 <div className="mt-auto flex items-end justify-between gap-8 pt-[3%]">
 <div className="flex flex-col items-start">
 <div className="h-px w-[clamp(8rem,18vw,15rem)] bg-fellowship-navy/70" />
 <span className="mt-1 text-fellowship-navy text-[clamp(0.65rem,1.1vw,0.85rem)]">
 Authorized Signature
 </span>
 {template.signatoryName && (
 <span className="mt-0.5 text-[clamp(0.55rem,0.9vw,0.7rem)] text-gray-500">
 {template.signatoryName} · {template.signatoryTitle}
 </span>
 )}
 </div>
 <div className="flex flex-col items-end">
 <div className="h-px w-[clamp(8rem,18vw,15rem)] bg-fellowship-navy/70" />
 <span className="mt-1 text-fellowship-navy text-[clamp(0.65rem,1.1vw,0.85rem)]">
 Date of Completion
 </span>
 {issuedDate && (
 <span className="mt-0.5 text-[clamp(0.55rem,0.9vw,0.7rem)] text-gray-500">
 {issuedDate}
 </span>
 )}
 </div>
 </div>

 {certificateNumber && (
 <p className="absolute bottom-2 left-[18%] right-[5%] text-center font-mono text-[clamp(0.5rem,0.7vw,0.6rem)] text-gray-400">
 {certificateNumber}
 </p>
 )}
 </div>
 </div>
 );
}

/* ---------- Decorative pieces ----------
 *
 * Mirrors the fellow's CertificateCanvas decorations. Implemented with
 * tiled CSS background-image SVGs (no preserveAspectRatio="none"
 * stretching) plus an inline rosette SVG with natural aspect ratio,
 * so tiles stay square at any column width and the rosette doesn't
 * distort under html2canvas-pro capture.
 */

const FLORAL_TILE_ADMIN = encodeURIComponent(
 `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">` +
 `<rect width="80" height="80" fill="#eef2ff"/>` +
 `<ellipse cx="40" cy="20" rx="7" ry="12" fill="#3b4eb0"/>` +
 `<ellipse cx="40" cy="60" rx="7" ry="12" fill="#3b4eb0"/>` +
 `<ellipse cx="20" cy="40" rx="12" ry="7" fill="#3b4eb0"/>` +
 `<ellipse cx="60" cy="40" rx="12" ry="7" fill="#3b4eb0"/>` +
 `<rect x="32" y="32" width="16" height="16" fill="#1e3a8a" transform="rotate(45 40 40)"/>` +
 `</svg>`,
);

const TEETH_TILE_LEFT_ADMIN = encodeURIComponent(
 `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" viewBox="0 0 20 22">` +
 `<rect width="20" height="22" fill="#1e3a8a"/>` +
 `<polygon points="0,2 20,11 0,20" fill="#ffffff"/>` +
 `</svg>`,
);

const TEETH_TILE_RIGHT_ADMIN = encodeURIComponent(
 `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" viewBox="0 0 20 22">` +
 `<rect width="20" height="22" fill="#1e3a8a"/>` +
 `<polygon points="20,2 0,11 20,20" fill="#ffffff"/>` +
 `</svg>`,
);

function LeftBorder() {
 return (
 <div className="absolute inset-y-0 left-0 w-[18%] overflow-hidden">
 <div
 className="absolute inset-y-0 left-0 w-[72%]"
 style={{
 backgroundImage: `url("data:image/svg+xml;utf8,${FLORAL_TILE_ADMIN}")`,
 backgroundSize: "80px 80px",
 backgroundRepeat: "repeat",
 }}
 />
 <div
 className="absolute inset-y-0 left-[72%] w-[28%]"
 style={{
 backgroundImage: `url("data:image/svg+xml;utf8,${TEETH_TILE_RIGHT_ADMIN}")`,
 backgroundSize: "100% 22px",
 backgroundRepeat: "repeat-y",
 }}
 />
 <div
 className="absolute"
 style={{
 left: "28%",
 top: "52%",
 bottom: 0,
 width: "30%",
 backgroundColor: "#1e3a8a",
 clipPath:
 "polygon(0% 0%, 100% 0%, 100% calc(100% - 32px), 50% 100%, 0% calc(100% - 32px))",
 }}
 />
 <div
 className="absolute"
 style={{
 left: "42%",
 top: "52%",
 bottom: "5%",
 width: "2%",
 backgroundColor: "#3b4eb0",
 }}
 />
 <svg
 aria-hidden
 viewBox="0 0 120 120"
 className="absolute"
 style={{ left: "8%", top: "38%", width: "75%", height: "auto", filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.15))" }}
 >
 <g fill="#f5a623">
 <path d="M60,0 L66,18 L54,18 Z" />
 <path d="M82.3,5.4 L82.7,24.2 L71.2,21.1 Z" />
 <path d="M102.4,17.6 L96.0,35.2 L86.5,28.2 Z" />
 <path d="M114.6,37.7 L102.9,52.4 L96.0,41.0 Z" />
 <path d="M120,60 L102,66 L102,54 Z" />
 <path d="M114.6,82.3 L96.0,79.0 L102.9,67.6 Z" />
 <path d="M102.4,102.4 L86.5,91.8 L96.0,84.8 Z" />
 <path d="M82.3,114.6 L71.2,98.9 L82.7,95.8 Z" />
 <path d="M60,120 L54,102 L66,102 Z" />
 <path d="M37.7,114.6 L37.3,95.8 L48.8,98.9 Z" />
 <path d="M17.6,102.4 L24.0,84.8 L33.5,91.8 Z" />
 <path d="M5.4,82.3 L17.1,67.6 L24.0,79.0 Z" />
 <path d="M0,60 L18,54 L18,66 Z" />
 <path d="M5.4,37.7 L24.0,41.0 L17.1,52.4 Z" />
 <path d="M17.6,17.6 L33.5,28.2 L24.0,35.2 Z" />
 <path d="M37.7,5.4 L48.8,21.1 L37.3,24.2 Z" />
 </g>
 <circle cx="60" cy="60" r="42" fill="#f5a623" />
 <circle cx="60" cy="60" r="32" fill="#fbbf24" />
 <circle cx="60" cy="60" r="26" fill="none" stroke="#f5a623" strokeWidth="3" />
 </svg>
 </div>
 );
}

function RightBorder() {
 return (
 <div
 className="absolute inset-y-0 right-0 w-[3%]"
 style={{
 backgroundImage: `url("data:image/svg+xml;utf8,${TEETH_TILE_LEFT_ADMIN}")`,
 backgroundSize: "100% 22px",
 backgroundRepeat: "repeat-y",
 }}
 />
 );
}

