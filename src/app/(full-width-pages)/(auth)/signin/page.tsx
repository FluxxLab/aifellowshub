import SignInForm from "@/components/auth/SignInForm";
import PageSkeleton from "@/components/ui/loader/PageSkeleton";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign in · AI Fellows LMS",
  description:
    "Sign in to continue your AI Ethics & Governance Fellowship journey.",
};

export default function SignIn() {
  // Wrapped in <Suspense> because SignInForm reads `useSearchParams()`
  // (via `useSelectedSignInRole`) which Next won't statically
  // prerender without a boundary. The detail-shaped skeleton mirrors
  // the form's roughly-square aspect ratio so the layout doesn't jump
  // when the real form hydrates.
  return (
    <Suspense fallback={<PageSkeleton variant="detail" label="Loading sign in…" />}>
      <SignInForm />
    </Suspense>
  );
}
