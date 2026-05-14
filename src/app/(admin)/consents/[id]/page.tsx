import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ConsentDocumentView from "@/components/admin/consents/ConsentDocumentView";
import { getFellowConsentServer } from "@/lib/api/consents.server";

export const metadata: Metadata = {
  title: "Consent document · AI Fellows LMS",
  robots: { index: false, follow: false },
};

export default async function ConsentDocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const consent = await getFellowConsentServer(id);
  if (!consent) notFound();
  return <ConsentDocumentView consent={consent} />;
}
