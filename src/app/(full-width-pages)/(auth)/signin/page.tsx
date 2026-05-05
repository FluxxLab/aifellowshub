import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign in · AI Fellows LMS",
  description:
    "Sign in to continue your AI Ethics & Governance Fellowship journey.",
};

export default function SignIn() {
  // Wrapped in <Suspense> because SignInForm reads `useSearchParams()`
  // (via `useSelectedSignInRole`) which Next 16 won't statically
  // prerender without a boundary. The fallback is empty — the form
  // is the entire visual content of the page.
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}
