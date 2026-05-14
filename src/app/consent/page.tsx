import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ConsentWizard from "@/components/auth/consent/ConsentWizard";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { backendFetch } from "@/lib/api/backend";

export const metadata: Metadata = {
  title: "Fellow consent · AI Fellows LMS",
  description:
    "Review and agree to the Fellowship's Code of Conduct and Data Protection Consent before continuing to the dashboard.",
  robots: { index: false, follow: false },
};

type ProfileResponse = {
  user: {
    fullName: string;
    country: string | null;
  };
};

export default async function ConsentPage() {
  const user = await getCurrentUser();

  // Non-fellow roles never see consent — bounce them to home immediately.
  if (user.role !== "fellow") redirect("/home");

  // If both are already accepted there's nothing to do — back to the
  // dashboard. Catches the back-button case after submission.
  const coc = user.codeOfConductAcceptedAt;
  const dp = user.dataConsentAcceptedAt;
  if (coc && dp) redirect("/home");

  // Pull the fellow's profile so we can prefill name + country. Best-
  // effort — empty defaults if the call fails; the form is still usable.
  let fullName = user.fullName;
  let country: string | null = null;
  try {
    const res = await backendFetch("/users/me", { method: "GET" });
    if (res.ok) {
      const data = (await res.json()) as ProfileResponse;
      fullName = data.user.fullName ?? user.fullName;
      country = data.user.country ?? null;
    }
  } catch {
    // Ignore — wizard still renders with name from JWT.
  }

  const initialStep: 1 | 2 = coc ? 2 : 1;

  return (
    <ConsentWizard
      initialStep={initialStep}
      fellowName={fullName}
      fellowCountry={country}
    />
  );
}
