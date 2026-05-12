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
 <div className="font-bold tracking-tight text-gray-900 text-[clamp(1rem,2.4vw,1.75rem)]">
 luminate
 </div>
 <div className="flex items-center gap-2">
 {template.logoUrl ? (
 <Image
 src={template.logoUrl}
 alt="Programme logos"
 width={220}
 height={60}
 className="h-[clamp(1.75rem,3.5vw,3rem)] w-auto"
 />
 ) : (
 <LogoLockup />
 )}
 </div>
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

/** Wide left border: patterned column + triangle strip + rosette badge. */
function LeftBorder() {
 return (
 <div className="absolute inset-y-0 left-0 w-[18%]">
 {/* Floral pattern column */}
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
 {/* Triangle/zigzag edge strip */}
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
 {/* Vertical accent ribbon under the rosette */}
 <div className="absolute left-[55%] top-0 h-full w-[6%] bg-blue-700" />
 {/* Rosette */}
 <Rosette />
 </div>
 );
}

/** Thin right border — triangle strip only, mirrored. */
function RightBorder() {
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

function Rosette() {
 return (
 <svg
 aria-hidden
 viewBox="0 0 120 200"
 className="absolute left-[35%] top-1/2 h-[35%] w-auto -translate-y-1/2"
 style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.15))" }}
 >
 {/* Ribbon tails */}
 <polygon points="42,100 42,190 60,170 78,190 78,100" fill="#1e3a8a" />
 <polygon points="42,100 42,160 50,150 50,100" fill="#3b4eb0" />
 <polygon points="78,100 78,160 70,150 70,100" fill="#3b4eb0" />
 {/* Rosette outer (gear-like petals) */}
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
 {/* Inner medal */}
 <circle cx="60" cy="65" r="30" fill="#fbbf24" />
 <circle cx="60" cy="65" r="25" fill="none" stroke="#f5a623" strokeWidth="2" />
 </svg>
 );
}

function LogoLockup() {
 return (
 <div className="flex items-center gap-2 text-fellowship-navy">
 <span className="text-[clamp(0.7rem,1.5vw,1rem)] font-bold tracking-tight">PIC</span>
 <span className="h-6 w-px bg-fellowship-navy/40" />
 <span className="text-[clamp(0.55rem,1vw,0.75rem)] font-bold leading-tight tracking-tight text-error-600">
 AFRICA HUB FOR<br />INNOVATION &amp;<br />DEVELOPMENT
 </span>
 </div>
 );
}
