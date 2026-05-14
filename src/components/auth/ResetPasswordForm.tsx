"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

/**
 * Step 2 of the password-reset flow. Receives the single-use token
 * from the URL ({/reset-password/[token]}), POSTs it + the new password,
 * then bounces the user back to /signin where they sign in normally.
 *
 * We deliberately don't auto-sign-in after reset: it forces a fresh
 * credential flow on the new password, and lets the fellow's normal
 * post-sign-in checks (mustChangePassword=false, consent gate) run
 * exactly once via the canonical path.
 */
export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    pwd.length >= 10 && pwd === confirm && !submitting && token.length >= 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: pwd }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Request failed (${res.status})`);
      }
      toast.success("Password updated", "Sign in with the new password.");
      router.replace("/signin");
    } catch (err) {
      toast.errorFromException("Couldn't reset password", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto sm:pt-16">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm sm:text-title-md">
              Choose a new password
            </h1>
            <p className="text-sm text-gray-500">
              Pick something at least 10 characters long. You&apos;ll sign in
              with the new password on the next screen.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>
                New password <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={show ? "text" : "password"}
                  placeholder="At least 10 characters"
                  defaultValue={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? (
                    <EyeIcon className="size-5" />
                  ) : (
                    <EyeCloseIcon className="size-5" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <Label>
                Confirm password <span className="text-error-500">*</span>
              </Label>
              <Input
                type={show ? "text" : "password"}
                placeholder="Repeat the password"
                defaultValue={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              {confirm.length > 0 && confirm !== pwd && (
                <p className="mt-1 text-xs text-error-600">
                  Passwords don&apos;t match yet.
                </p>
              )}
            </div>
            <Button
              type="submit"
              variant="fellowship"
              className="w-full bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
              disabled={!canSubmit}
            >
              {submitting ? "Saving…" : "Set new password"}
            </Button>
            <p className="text-center text-sm text-gray-500">
              <Link
                href="/signin"
                className="font-medium text-fellowship-navy hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
