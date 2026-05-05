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

export default function CertificatePreview({
 template,
 fellowName ="Sample Fellow",
 issuedDate ="—",
 certificateNumber ="PIC-AIF-YYYY-NNNN",
}: CertificatePreviewProps) {
 const body = template.bodyText
 .replace(/\{\{fellow_name\}\}/g, fellowName)
 .replace(/\{\{course_title\}\}/g, template.courseTitle)
 .replace(/\{\{issued_date\}\}/g, issuedDate);

 return (
 <div className="relative aspect-[1.414/1] w-full overflow-hidden rounded-xl border-4 border-fellowship-navy bg-white shadow-theme-lg">
 {/* Decorative inner border */}
 <div className="absolute inset-3 rounded-lg border border-warning-400/60"/>

 {/* Top corner ornaments */}
 <div className="absolute left-6 top-6 h-10 w-10 rounded-tl-lg border-l-4 border-t-4 border-warning-400"/>
 <div className="absolute right-6 top-6 h-10 w-10 rounded-tr-lg border-r-4 border-t-4 border-warning-400"/>
 <div className="absolute bottom-6 left-6 h-10 w-10 rounded-bl-lg border-b-4 border-l-4 border-warning-400"/>
 <div className="absolute bottom-6 right-6 h-10 w-10 rounded-br-lg border-b-4 border-r-4 border-warning-400"/>

 <div className="relative flex h-full flex-col items-center justify-between px-8 py-10 text-center sm:px-14 sm:py-14">
 {/* Header */}
 <div className="flex flex-col items-center gap-3">
 {template.logoUrl && (
 <div className="rounded-md bg-white px-3 py-1.5">
 <Image
 src={template.logoUrl}
 alt="Programme logo" width={150}
 height={40}
 className="h-8 w-auto sm:h-10"/>
 </div>
 )}
 <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-fellowship-navy sm:text-xs">
 AI Ethics &amp; Governance Fellowship
 </p>
 </div>

 {/* Main content */}
 <div className="flex flex-col items-center gap-3 px-4">
 <h2 className="font-bold text-fellowship-navy text-2xl tracking-tight sm:text-4xl">
 {template.title}
 </h2>
 <p className="text-xs uppercase tracking-widest text-gray-500">
 Awarded to
 </p>
 <p
 className="font-bold text-fellowship-navy" style={{ fontSize:" clamp(1.25rem, 4vw, 2.5rem)"}}
 >
 {fellowName}
 </p>
 <p className="max-w-2xl text-xs leading-relaxed text-gray-700 sm:text-sm">
 {body}
 </p>
 </div>

 {/* Footer */}
 <div className="flex w-full items-end justify-between gap-6">
 <div className="flex flex-col items-start text-left">
 <span className="border-b border-fellowship-navy/40 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 sm:text-xs">
 Issued
 </span>
 <span className="mt-1 text-xs font-semibold text-fellowship-navy sm:text-sm">
 {issuedDate}
 </span>
 <span className="mt-2 text-[9px] font-mono text-gray-400 sm:text-[10px]">
 {certificateNumber}
 </span>
 </div>

 <div className="flex flex-col items-center text-center">
 <div className="font-signature text-xl text-fellowship-navy italic sm:text-2xl">
 {template.signatoryName.split(" ").slice(-1)[0]}
 </div>
 <div className="mt-1 w-32 border-t border-fellowship-navy/60 sm:w-48"/>
 <span className="mt-1 text-[10px] font-semibold text-fellowship-navy sm:text-xs">
 {template.signatoryName}
 </span>
 <span className="text-[9px] uppercase tracking-wider text-gray-500 sm:text-[10px]">
 {template.signatoryTitle}
 </span>
 </div>
 </div>
 </div>
 </div>
 );
}
