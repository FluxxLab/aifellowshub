"use client";
import SignInRoleTabs, {
  useSelectedSignInRole,
  type SignInRole,
} from "@/components/auth/SignInRoleTabs";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { roleHome } from "@/lib/auth/role-home";
import type { Role } from "@/lib/auth/users";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

/**
 * Role-specific copy keyed off the selected role tab. The auth flow
 * itself is identical across roles — these strings just personalise
 * the framing so each role sees a heading that recognises them.
 *
 * Important: this is UI-only personalisation. The backend determines
 * the actual role from the user's stored account; if a fellow signs
 * in via the Mentor tab, they still land on the fellow home (the
 * role gate in `(fellow)/layout.tsx` enforces that).
 */
const ROLE_COPY: Record<
  SignInRole,
  { heading: string; subline: string }
> = {
  fellow: {
    heading: "Welcome back",
    subline:
      "Sign in to continue your AI Ethics & Governance Fellowship journey.",
  },
  mentor: {
    heading: "Welcome back, mentor",
    subline: "Pick up where you left off reviewing your fellows' capstones.",
  },
  faculty: {
    heading: "Welcome back, faculty",
    subline:
      "Sign in to keep authoring and grading your cohort's curriculum.",
  },
};

export default function SignInForm() {
 const router = useRouter();
 const selectedRole = useSelectedSignInRole();
 const copy = ROLE_COPY[selectedRole];
 const [showPassword, setShowPassword] = useState(false);
 const [keepLoggedIn, setKeepLoggedIn] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [errorMessage, setErrorMessage] = useState<string | null>(null);
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");

 const submitLogin = async (email: string, password: string) => {
   setSubmitting(true);
   setErrorMessage(null);
   try {
     const res = await fetch("/api/auth/login", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ email, password }),
       credentials: "include",
     });
     if (!res.ok) {
       const data = await res.json().catch(() => ({}));
       setErrorMessage(data.message ?? "Email or password is incorrect.");
       setSubmitting(false);
       return;
     }
     // The login response carries `{ user }`; pull the role from it
     // and route to the role's home. Each role-group layout double-
     // checks server-side, so a stale/wrong destination would just
     // bounce — but routing right the first time avoids the flash.
     const data = (await res.json().catch(() => ({}))) as {
       user?: { role?: Role };
     };
     const role = data.user?.role;
     router.push(role ? roleHome(role) : "/home");
     router.refresh();
   } catch {
     setErrorMessage("Couldn't reach the server. Please try again.");
     setSubmitting(false);
   }
 };

 return (
 <div className="flex flex-col flex-1 lg:w-1/2 w-full h-full overflow-y-auto custom-scrollbar px-6 py-8 sm:px-10">
 <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
 <Link
 href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700">
 <ChevronLeftIcon />
 Back to home
 </Link>
 </div>

 <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
 <SignInRoleTabs />
 <div className="mb-8">
 <h1 className="mb-2 font-bold text-gray-800 text-title-sm sm:text-title-md">
 {copy.heading}
 </h1>
 <p className="text-sm text-gray-500">
 {copy.subline}
 </p>
 </div>

 <form
 onSubmit={(e) => {
 e.preventDefault();
 submitLogin(email, password);
 }}
 >
 <div className="space-y-6">
 {errorMessage && (
 <div className="rounded-md border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700">
 {errorMessage}
 </div>
 )}
 <div>
 <Label>
 Email <span className="text-error-500">*</span>
 </Label>
 <Input
 placeholder="you@example.com" type="email"
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
 placeholder="Enter your password"
 defaultValue={password}
 onChange={(e) => setPassword(e.target.value)}/>
 <button
 type="button" onClick={() => setShowPassword((v) => !v)}
 aria-label={showPassword ?"Hide password":"Show password"}
 className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
 {showPassword ? (
 <EyeIcon className="h-5 w-5 text-gray-500"/>
 ) : (
 <EyeCloseIcon className="h-5 w-5 text-gray-500"/>
 )}
 </button>
 </div>
 </div>

 <div className="flex items-center justify-between">
 <label className="flex items-center gap-3 cursor-pointer">
 <Checkbox checked={keepLoggedIn} onChange={setKeepLoggedIn} />
 <span className="block font-normal text-gray-700 text-theme-sm">
 Keep me signed in
 </span>
 </label>
 <Link
 href="/forgot-password" className="text-sm font-semibold text-fellowship-navy hover:text-fellowship-navy-dark">
 Forgot password?
 </Link>
 </div>

 <Button
 className="w-full" size="md" variant="fellowship" type="submit" disabled={submitting}
 >
 {submitting ?"Signing in…":"Sign in "}
 </Button>
 </div>
 </form>
 </div>
 </div>
 );
}
