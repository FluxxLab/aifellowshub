"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { ApiError, apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";

const POLICY_HINT =
  "12-72 characters, including a letter and a digit.";
const POLICY_RE = /^(?=.*[A-Za-z])(?=.*\d).{12,72}$/;

export default function ChangePasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const forced = params.get("forced") === "1";
  const next = params.get("next") || "/";

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNew, setConfirmNew] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (currentPassword.length < 8) {
      setError("Enter your current password.");
      return;
    }
    if (!POLICY_RE.test(newPassword)) {
      setError(POLICY_HINT);
      return;
    }
    if (newPassword !== confirmNew) {
      setError("New password and confirmation don't match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      toast.success("Password updated", "You're all set.");
      router.push(next);
      router.refresh();
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Current password is incorrect.");
          return;
        }
        setError(err.message);
        return;
      }
      toast.errorFromException("Couldn't update password", err);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full h-full overflow-y-auto custom-scrollbar px-6 py-8 sm:px-10">
      {!forced && (
        <div className="w-full max-w-md mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            <ChevronLeftIcon />
            Back
          </Link>
        </div>
      )}

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto pt-8">
        <div className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-fellowship-navy">
            Account security
          </p>
          <h1 className="mb-2 font-bold text-gray-800 text-title-sm sm:text-title-md">
            {forced ? "Set a new password" : "Change your password"}
          </h1>
          <p className="text-sm text-gray-500">
            {forced
              ? "You signed in with a temporary password. Choose a new one to continue."
              : "Pick something you don't use anywhere else. We'll sign your other devices out."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <Label>
              Current password <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                placeholder={
                  forced ? "The temp password you were given" : "Current password"
                }
                defaultValue={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 z-30 -translate-y-1/2"
              >
                {showCurrent ? (
                  <EyeIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <EyeCloseIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Label>
              New password <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showNext ? "text" : "password"}
                placeholder="New password"
                defaultValue={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNext((v) => !v)}
                aria-label={showNext ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 z-30 -translate-y-1/2"
              >
                {showNext ? (
                  <EyeIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <EyeCloseIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">{POLICY_HINT}</p>
          </div>

          <div>
            <Label>
              Confirm new password <span className="text-error-500">*</span>
            </Label>
            <Input
              type={showNext ? "text" : "password"}
              placeholder="Repeat your new password"
              defaultValue={confirmNew}
              onChange={(e) => setConfirmNew(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">
              {error}
            </p>
          )}

          <Button
            className="w-full"
            size="md"
            variant="fellowship"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
