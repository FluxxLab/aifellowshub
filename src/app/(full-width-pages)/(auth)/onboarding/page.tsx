import OnboardingChecklist from "@/components/auth/OnboardingChecklist";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding · AI Fellows LMS",
  description:
    "Complete your onboarding checklist to start the Fellowship.",
};

export default function OnboardingPage() {
  return <OnboardingChecklist />;
}
