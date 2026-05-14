import type { Metadata } from "next";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset password · AI Fellows LMS",
  description:
    "Choose a new password for your AI Fellows account using the single-use link from your email.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage({
  params,
}: {
  params: { token: string };
}) {
  return <ResetPasswordForm token={params.token} />;
}
