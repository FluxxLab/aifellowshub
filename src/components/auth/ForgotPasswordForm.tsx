"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import { toast } from "@/lib/toast";
import Link from "next/link";
import React, { useState } from "react";

/**
 * Step 1 of the password-reset flow. Asks for the email, fires
 * POST /api/auth/forgot-password, then shows a "check your inbox"
 * confirmation regardless of whether the email matched a real user
 * (the backend deliberately doesn't confirm membership — see
 * AuthService.requestPasswordReset).
 */
export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Request failed (${res.status})`);
      }
      setSubmitted(true);
    } catch (err) {
      toast.errorFromException("Couldn't send reset email", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ChevronLeftIcon className="size-5" />
          Back to sign in
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm sm:text-title-md">
              Forgot your password?
            </h1>
            <p className="text-sm text-gray-500">
              Enter the email tied to your fellowship account and we&apos;ll
              send a single-use link to set a new password.
            </p>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-success-200 bg-success-50 p-5 text-sm text-success-800">
              <p className="font-semibold">Check your inbox</p>
              <p className="mt-1 text-success-700/90">
                If an account exists for{" "}
                <span className="font-medium">{email}</span>, a reset link is on
                its way. The link is valid for 30 minutes and can be used once.
              </p>
              <p className="mt-3">
                <Link
                  href="/signin"
                  className="font-semibold text-fellowship-navy hover:underline"
                >
                  Back to sign in
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  defaultValue={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                variant="fellowship"
                className="w-full bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
                disabled={!email.trim() || submitting}
              >
                {submitting ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
