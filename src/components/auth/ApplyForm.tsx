"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { ApiError, apiFetch } from "@/lib/api/client";
// `useCohortIsFull` lives in its own file so the marketing page can
// use it without pulling Turnstile + the full registration form into
// the homepage bundle. Re-exported below for callers that previously
// imported it from `ApplyForm`.
import { useCohortIsFull } from "@/lib/hooks/useCohortIsFull";
import { toast } from "@/lib/toast";
import { Turnstile } from "@marsidev/react-turnstile";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export { useCohortIsFull };

// Cloudflare-issued public sitekey. Empty in local dev (the widget
// hides itself and the backend skips verification when its own
// TURNSTILE_SECRET is unset, so dev keeps working).
const TURNSTILE_SITEKEY = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY ?? "";

export default function ApplyForm() {
 const cohortIsFull = useCohortIsFull();

 return (
 <div className="flex flex-col flex-1 lg:w-1/2 w-full h-full overflow-y-auto custom-scrollbar px-6 py-8 sm:px-10">
 <div className="w-full max-w-md mx-auto">
 <Link
 href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700">
 <ChevronLeftIcon />
 Back to home
 </Link>
 </div>

 <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto pt-8">
 {cohortIsFull ? <WaitlistForm /> : <ApplicationForm />}
 </div>
 </div>
 );
}

export function ApplicationForm() {
 const router = useRouter();
 const [showPassword, setShowPassword] = useState(false);
 const [agreedToTerms, setAgreedToTerms] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [fullName, setFullName] = useState("");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [error, setError] = useState<string | null>(null);
 const [captchaToken, setCaptchaToken] = useState<string>("");

 const captchaRequired = TURNSTILE_SITEKEY.length > 0;

 const onSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   setError(null);
   if (fullName.trim().length < 2) {
     setError("Full name is required.");
     return;
   }
   if (!email.includes("@")) {
     setError("Please enter a valid email.");
     return;
   }
   if (password.length < 12 || password.length > 72) {
     setError("Password must be 12-72 characters and include a letter and a digit.");
     return;
   }
   if (captchaRequired && !captchaToken) {
     setError("Please complete the verification challenge.");
     return;
   }
   setSubmitting(true);
   try {
     await apiFetch<{ user: { id: string } }>("/auth/register", {
       method: "POST",
       body: {
         fullName: fullName.trim(),
         email: email.trim(),
         password,
         ...(captchaToken ? { captchaToken } : {}),
       },
     });
     router.push("/onboarding");
   } catch (err) {
     setSubmitting(false);
     // The backend invalidates the Turnstile token on use; if the
     // submit fails for any reason (validation, breach check, etc.)
     // the user must solve a fresh challenge before retrying.
     setCaptchaToken("");
     if (err instanceof ApiError && err.status === 409) {
       setError("An account with this email already exists. Try signing in.");
       return;
     }
     if (err instanceof ApiError && err.status === 400) {
       // Backend BadRequestException — message is safe to surface
       // (breach check, captcha failure, password policy).
       setError(err.message ?? "Please check your details and try again.");
       return;
     }
     toast.errorFromException("Couldn't create account", err);
   }
 };

 return (
 <>
 <div className="mb-8">
 <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-fellowship-navy">
 Cohort 2026 · Open
 </p>
 <h1 className="mb-2 font-bold text-gray-800 text-title-sm sm:text-title-md">
 Apply to the Fellowship
 </h1>
 <p className="text-sm text-gray-500">
 Seats are first-come-first-served. Once you finish onboarding, you&apos;re in.
 </p>
 </div>

 <form onSubmit={onSubmit}>
 <div className="space-y-5">
 <div>
 <Label>
 Full name <span className="text-error-500">*</span>
 </Label>
 <Input
   placeholder="e.g. Amina Okonkwo"
   type="text"
   defaultValue={fullName}
   onChange={(e) => setFullName(e.target.value)}
 />
 </div>

 <div>
 <Label>
 Email <span className="text-error-500">*</span>
 </Label>
 <Input
   placeholder="you@example.com"
   type="email"
   defaultValue={email}
   onChange={(e) => setEmail(e.target.value)}
 />
 </div>

 <div>
 <Label>
 Password <span className="text-error-500">*</span>
 </Label>
 <div className="relative">
 <Input
 type={showPassword ?"text":"password"}
 placeholder="At least 8 characters"
 defaultValue={password}
 onChange={(e) => setPassword(e.target.value)}
 />
 <button
 type="button" onClick={() => setShowPassword((v) => !v)}
 aria-label={showPassword ?"Hide password":"Show password"}
 className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
 {showPassword ? (
 <EyeIcon className="fill-gray-500"/>
 ) : (
 <EyeCloseIcon className="fill-gray-500"/>
 )}
 </button>
 </div>
 </div>

 <label className="flex items-start gap-3 cursor-pointer">
 <input
 type="checkbox" checked={agreedToTerms}
 onChange={(e) => setAgreedToTerms(e.target.checked)}
 className="mt-1 h-4 w-4 rounded border-gray-300 text-fellowship-navy focus:ring-fellowship-navy"/>
 <span className="text-sm text-gray-600">
 I agree to the{" "}
 <Link
 href="/terms" className="font-semibold text-fellowship-navy hover:text-fellowship-navy-dark">
 Terms &amp; Conditions
 </Link>{" "}
 and{" "}
 <Link
 href="/privacy" className="font-semibold text-fellowship-navy hover:text-fellowship-navy-dark">
 Privacy Policy
 </Link>
 .
 </span>
 </label>

 {captchaRequired && (
   <div>
     <Turnstile
       siteKey={TURNSTILE_SITEKEY}
       onSuccess={(token) => setCaptchaToken(token)}
       onExpire={() => setCaptchaToken("")}
       onError={() => setCaptchaToken("")}
       options={{ theme: "light", size: "flexible" }}
     />
   </div>
 )}

 {error && (
   <p className="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700">
     {error}
   </p>
 )}

 <Button
 className="w-full" size="md" variant="fellowship" type="submit"
 disabled={
   !agreedToTerms ||
   submitting ||
   (captchaRequired && !captchaToken)
 }
 >
 {submitting ? "Creating account…" : "Continue to onboarding"}
 </Button>
 </div>
 </form>

 <p className="mt-6 text-center text-sm text-gray-500">
 Already have an account?{" "}
 <Link
 href="/signin" className="font-semibold text-fellowship-navy hover:text-fellowship-navy-dark">
 Sign in
 </Link>
 </p>
 </>
 );
}

export function WaitlistForm() {
 const [submitted, setSubmitted] = useState(false);

 if (submitted) {
 return <WaitlistConfirmation />;
 }

 return (
 <>
 <div className="mb-6 inline-flex items-center gap-2 self-start rounded-full bg-warning-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-warning-700">
 <span aria-hidden className="h-2 w-2 rounded-full bg-warning-500"/>
 Cohort 2026 · Full
 </div>

 <div className="mb-8">
 <h1 className="mb-2 font-bold text-gray-800 text-title-sm sm:text-title-md">
 The current cohort is full
 </h1>
 <p className="text-sm leading-relaxed text-gray-500">
 Seats for this cohort have been claimed. Join the waitlist and we&apos;ll
 let you in if a seat opens up, or notify you when the next cohort
 opens.
 </p>
 </div>

 <form
 onSubmit={(e) => {
 e.preventDefault();
 setSubmitted(true);
 // Phase 1 (UI-first): waitlist submission is mocked.
 }}
 >
 <div className="space-y-5">
 <div>
 <Label>
 Full name <span className="text-error-500">*</span>
 </Label>
 <Input placeholder="e.g. Amina Okonkwo" type="text"/>
 </div>

 <div>
 <Label>
 Email <span className="text-error-500">*</span>
 </Label>
 <Input placeholder="you@example.com" type="email"/>
 </div>

 <Button className="w-full" size="md" variant="fellowship" type="submit">
 Join the waitlist
 </Button>
 </div>
 </form>

 <p className="mt-6 text-center text-sm text-gray-500">
 Already have an account?{" "}
 <Link
 href="/signin" className="font-semibold text-fellowship-navy hover:text-fellowship-navy-dark">
 Sign in
 </Link>
 </p>
 </>
 );
}

function WaitlistConfirmation() {
 return (
 <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
 <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning-100">
 <span aria-hidden className="text-2xl">
 ✓
 </span>
 </div>
 <h2 className="mb-2 text-title-sm font-bold text-gray-800">
 You&apos;re on the waitlist
 </h2>
 <p className="mb-6 text-sm leading-relaxed text-gray-600">
 We&apos;ll email you if a seat opens in the current cohort, or as soon as
 the next cohort opens for applications.
 </p>
 <Link
 href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-fellowship-navy hover:text-fellowship-navy-dark">
 <ChevronLeftIcon className="h-4 w-4"/>
 Back to home
 </Link>
 </div>
 );
}
