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

/* ---------- Decorative pieces ---------- */

/**
 * Whole left decoration as a single SVG — pattern, triangle strip,
 * vertical ribbon, and rosette all baked into one element. Mirrors
 * the fellow's CertificateCanvas so admin + fellow + verify all show
 * the same visual treatment.
 */
function LeftBorder() {
 return (
 <svg
 aria-hidden
 viewBox="0 0 180 1000"
 preserveAspectRatio="none"
 className="absolute inset-y-0 left-0 h-full w-[18%]"
 >
 <defs>
 <pattern id="cert-floral-admin" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
 <rect width="60" height="60" fill="#eef2ff" />
 <circle cx="30" cy="30" r="14" fill="#3b4eb0" />
 </pattern>
 <pattern id="cert-teeth-admin" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
 <rect width="36" height="36" fill="#1e3a8a" />
 <polygon points="0,0 36,0 18,18" fill="#ffffff" />
 <polygon points="0,36 36,36 18,18" fill="#ffffff" />
 </pattern>
 </defs>
 <rect x="0" y="0" width="120" height="1000" fill="url(#cert-floral-admin)" />
 <rect x="120" y="0" width="60" height="1000" fill="url(#cert-teeth-admin)" />
 <rect x="98" y="0" width="14" height="1000" fill="#1d4ed8" />
 <g transform="translate(60 500)">
 <polygon points="-18,0 -18,180 0,160 18,180 18,0" fill="#1e3a8a" />
 <polygon points="-18,0 -18,150 -10,140 -10,0" fill="#3b4eb0" />
 <polygon points="18,0 18,150 10,140 10,0" fill="#3b4eb0" />
 <circle cx="0" cy="-48" r="6" fill="#f5a623" />
 <circle cx="18.4" cy="-44.4" r="6" fill="#f5a623" />
 <circle cx="33.9" cy="-33.9" r="6" fill="#f5a623" />
 <circle cx="44.4" cy="-18.4" r="6" fill="#f5a623" />
 <circle cx="48" cy="0" r="6" fill="#f5a623" />
 <circle cx="44.4" cy="18.4" r="6" fill="#f5a623" />
 <circle cx="33.9" cy="33.9" r="6" fill="#f5a623" />
 <circle cx="18.4" cy="44.4" r="6" fill="#f5a623" />
 <circle cx="0" cy="48" r="6" fill="#f5a623" />
 <circle cx="-18.4" cy="44.4" r="6" fill="#f5a623" />
 <circle cx="-33.9" cy="33.9" r="6" fill="#f5a623" />
 <circle cx="-44.4" cy="18.4" r="6" fill="#f5a623" />
 <circle cx="-48" cy="0" r="6" fill="#f5a623" />
 <circle cx="-44.4" cy="-18.4" r="6" fill="#f5a623" />
 <circle cx="-33.9" cy="-33.9" r="6" fill="#f5a623" />
 <circle cx="-18.4" cy="-44.4" r="6" fill="#f5a623" />
 <circle cx="0" cy="0" r="46" fill="#f5a623" />
 <circle cx="0" cy="0" r="30" fill="#fbbf24" />
 <circle cx="0" cy="0" r="25" fill="none" stroke="#f5a623" strokeWidth="2" />
 </g>
 </svg>
 );
}

function RightBorder() {
 return (
 <svg
 aria-hidden
 viewBox="0 0 30 1000"
 preserveAspectRatio="none"
 className="absolute inset-y-0 right-0 h-full w-[3%]"
 >
 <defs>
 <pattern id="cert-teeth-right-admin" x="0" y="0" width="30" height="36" patternUnits="userSpaceOnUse">
 <rect width="30" height="36" fill="#1e3a8a" />
 <polygon points="0,0 30,0 15,18" fill="#ffffff" />
 <polygon points="0,36 30,36 15,18" fill="#ffffff" />
 </pattern>
 </defs>
 <rect x="0" y="0" width="30" height="1000" fill="url(#cert-teeth-right-admin)" />
 </svg>
 );
}

