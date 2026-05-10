import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import PageSkeleton from "@/components/ui/loader/PageSkeleton";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Change password · AI Fellows LMS",
  description:
    "Set a new password before continuing. Required after admin-issued temp credentials.",
};

export default function ChangePasswordPage() {
  // ChangePasswordForm uses `useSearchParams` to read `?forced=1&next=…`.
  // Next requires that to be inside a Suspense boundary so prerender
  // can bail out to CSR cleanly. Without this, `next build` errors at
  // the `/change-password` static-export step.
  return (
    <Suspense
      fallback={<PageSkeleton variant="detail" label="Loading password form…" />}
    >
      <ChangePasswordForm />
    </Suspense>
  );
}
