import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in · AI Fellows LMS",
  description:
    "Sign in to continue your AI Ethics & Governance Fellowship journey.",
};

export default function SignIn() {
  return <SignInForm />;
}
