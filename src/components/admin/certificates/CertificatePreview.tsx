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
 src="/images/certificate-lms-v2.jpg"
 alt=""
 fill
 priority
 unoptimized
 quality={100}
 sizes="(max-width: 1024px) 100vw, 1024px"
 className="object-cover"
 />

 {/* Fellow name — the only variable field. Sits just above the orange rule,
     centred in the content area at ~60% width. The two signatures and titles
     are baked into the template image, so no signature/date overlays here.
     Keep in lockstep with `CertificateCanvas` in
     `components/fellow/MyCertificatesView.tsx`. */}
 <div
 className="absolute flex justify-center"
 style={{ top: "49%", left: "22%", right: "2%" }}
 >
 <p
 className="text-center font-bold uppercase text-black leading-none"
 // Caps run visually heavier, and the name has to clear the rule
 // immediately beneath it — keep in lockstep with CertificateCanvas.
 style={{ fontSize: "clamp(0.85rem, 2vw, 1.5rem)" }}
 >
 {fellowName}
 </p>
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
