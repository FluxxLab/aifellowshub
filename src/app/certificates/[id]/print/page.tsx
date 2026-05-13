import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CertificateCanvas } from "@/components/fellow/MyCertificatesView";
import { getPublicCertificateServer } from "@/lib/api/fellow-certificates.server";
import PrintTrigger from "./PrintTrigger";

/**
 * Public print-friendly certificate view. Opened in a new tab from the
 * fellow's "Download PDF" button; the page auto-triggers the browser's
 * print dialog so the user can save as PDF.
 *
 * Renders only the canvas at A4 landscape proportions — no chrome, no
 * verify banner, no details table. The verify page is the place for
 * that; this is purely for portable, shareable, printable output.
 *
 * Public on purpose: certificates already have a public verification
 * URL anyway, and shareability is the point. Don't add an auth gate.
 */
export const metadata: Metadata = {
 title: "Certificate · AI Fellows",
 robots: { index: false, follow: false },
};

export default async function PrintCertificatePage({
 params,
}: {
 params: { id: string };
}) {
 const { id } = params;
 const result = await getPublicCertificateServer(id);
 if (!result || !result.valid) notFound();

 const c = result.certificate;
 return (
 <>
 <PrintTrigger />
 <main className="print-page mx-auto flex min-h-screen w-full max-w-[1240px] items-center justify-center bg-gray-100 p-6 print:m-0 print:max-w-none print:bg-white print:p-0">
 <div className="w-full">
 <CertificateCanvas
 fellowName={c.fellowName}
 programmeName={c.programmeName}
 cohortName={c.cohortName}
 capstoneTitle={c.capstoneTitle}
 completedAtLabel={new Date(c.completedAt).toLocaleDateString(undefined, {
 timeZone: "Africa/Lagos",
 day: "numeric",
 month: "long",
 year: "numeric",
 })}
 signatories={c.signatories}
 isPreview={false}
 />
 </div>
 </main>
 <style>{`
 @page { size: A4 landscape; margin: 0; }
 @media print {
 html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
 .print-page { padding: 0 !important; }
 /* Ensure decorative borders and rosette retain colour when printed.
 Browsers strip backgrounds by default; this hint reinstates them. */
 * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
 }
 `}</style>
 </>
 );
}
