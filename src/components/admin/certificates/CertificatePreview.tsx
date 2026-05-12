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
 * Admin preview of the AI Ethics & Governance Fellowship completion
 * certificate.
 *
 * Renders the brand-approved template image full-bleed and overlays
 * the variable fields (fellow name, signature, date) at calibrated
 * absolute positions. All decoration — borders, rosette, logos,
 * fixed copy ("Certificate of Completion", body paragraph, field
 * labels) — is baked into the template PNG. Keep the overlay
 * positions in lockstep with `CertificateCanvas` in
 * `components/fellow/MyCertificatesView.tsx`.
 *
 * Template asset lives at `/public/images/certificate-template.png`.
 */
export default function CertificatePreview({
 template,
 fellowName = "",
 issuedDate = "",
 certificateNumber,
}: CertificatePreviewProps) {
 return (
 <div className="relative aspect-[1.414/1] w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-md">
 <Image
 src="/images/Certificate%20lms.png"
 alt=""
 fill
 priority
 unoptimized
 quality={100}
 sizes="(max-width: 1024px) 100vw, 1024px"
 className="object-cover"
 />

 {/* Fellow name — sits above the orange rule on the template */}
 <div
 className="absolute flex justify-center"
 style={{ top: "53%", left: "20%", right: "8%" }}
 >
 <p
 className="font-signature text-fellowship-navy leading-none"
 style={{ fontSize: "clamp(1.5rem, 4vw, 3rem)" }}
 >
 {fellowName}
 </p>
 </div>

 {/* Signature — above "Authorized Signature" label on the template */}
 <div className="absolute" style={{ bottom: "13%", left: "32%" }}>
 {template.signatoryName && (
 <p
 className="font-signature text-fellowship-navy leading-none"
 style={{ fontSize: "clamp(0.9rem, 1.8vw, 1.4rem)" }}
 >
 {template.signatoryName}
 </p>
 )}
 </div>

 {/* Date — above "Date of Completion" label on the template */}
 <div className="absolute text-right" style={{ bottom: "13%", right: "10%" }}>
 {issuedDate && (
 <p
 className="text-fellowship-navy leading-none"
 style={{ fontSize: "clamp(0.75rem, 1.4vw, 1rem)" }}
 >
 {issuedDate}
 </p>
 )}
 </div>

 {certificateNumber && (
 <p
 className="absolute bottom-1 text-center font-mono text-gray-400"
 style={{
 left: "20%",
 right: "8%",
 fontSize: "clamp(0.5rem, 0.7vw, 0.6rem)",
 }}
 >
 {certificateNumber}
 </p>
 )}
 </div>
 );
}
