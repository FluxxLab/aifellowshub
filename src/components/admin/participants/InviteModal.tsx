"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { CheckCircleIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { ApiError, apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import type { Sector } from "@/lib/api/participants";
import { useRouter } from "next/navigation";

const SECTOR_TO_BACKEND: Record<Sector, string> = {
  Healthcare: "healthcare",
  EdTech: "edtech",
  Agriculture: "agriculture",
  "Economic Inclusion Development": "economic_inclusion_development",
};

type InviteRole ="admin"|"faculty"|"mentor";

const ALL_SECTORS: Sector[] = [
  "Healthcare",
  "EdTech",
  "Agriculture",
  "Economic Inclusion Development",
];

type InviteModalProps = {
 isOpen: boolean;
 onClose: () => void;
};

export default function InviteModal({ isOpen, onClose }: InviteModalProps) {
 const router = useRouter();
 const [role, setRole] = useState<InviteRole>("admin");
 const [fullName, setFullName] = useState("");
 const [email, setEmail] = useState("");
 const [expertise, setExpertise] = useState<Sector[]>([]);
 const [note, setNote] = useState("");
 const [submitting, setSubmitting] = useState(false);
 const [result, setResult] = useState<{ email: string; tempPassword: string } | null>(null);

 const canSubmit =
 fullName.trim().length > 1 && /\S+@\S+\.\S+/.test(email) && !submitting;

 const reset = () => {
 setRole("admin");
 setFullName("");
 setEmail("");
 setExpertise([]);
 setNote("");
 setResult(null);
 };

 const handleClose = () => {
 onClose();
 // Reset on close so reopening starts fresh
 setTimeout(reset, 200);
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!canSubmit) return;
 setSubmitting(true);
 try {
   const sector = expertise[0] ? SECTOR_TO_BACKEND[expertise[0]] : undefined;
   const data = await apiFetch<{ tempPassword: string; user: { email: string } }>(
     "/admin/users",
     {
       method: "POST",
       body: {
         fullName: fullName.trim(),
         email: email.trim(),
         role,
         sector,
       },
     },
   );
   setResult({ email: data.user.email, tempPassword: data.tempPassword });
   toast.success("Account created", `${data.user.email} can sign in now.`);
   router.refresh();
 } catch (err) {
   if (err instanceof ApiError && err.status === 409) {
     toast.error(
       "Couldn't send invitation",
       "An account with that email already exists.",
     );
   } else {
     toast.errorFromException("Couldn't send invitation", err);
   }
 } finally {
   setSubmitting(false);
 }
 };

 const toggleSector = (s: Sector) => {
 setExpertise((prev) =>
 prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
 );
 };

 return (
 <Modal
 isOpen={isOpen}
 onClose={handleClose}
 className="m-4 max-w-lg">
 {result ? (
 <SuccessState
 email={result.email}
 tempPassword={result.tempPassword}
 role={role}
 onSendAnother={reset}
 onDone={handleClose}
 />
 ) : (
 <form onSubmit={handleSubmit} className="p-6 sm:p-8">
 <div className="mb-6">
 <h2 className="text-title-sm font-bold text-gray-800">
 Invite a new team member
 </h2>
 <p className="mt-1 text-sm text-gray-500">
 They&apos;ll receive an email with a link to set up their account.
 </p>
 </div>

 <div className="space-y-5">
 <div>
 <Label>
 Role <span className="text-error-500">*</span>
 </Label>
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
 <RoleOption
 selected={role ==="admin"}
 onClick={() => setRole("admin")}
 title="Admin" description="Runs the programme day-to-day."/>
 <RoleOption
 selected={role ==="faculty"}
 onClick={() => setRole("faculty")}
 title="Faculty" description="Curates courses and modules."/>
 <RoleOption
 selected={role ==="mentor"}
 onClick={() => setRole("mentor")}
 title="Mentor" description="Guides fellows; reviews capstones."/>
 </div>
 </div>

 <div>
 <Label>
 Full name <span className="text-error-500">*</span>
 </Label>
 <Input
 type="text" placeholder="e.g. Aminata Diallo" defaultValue={fullName}
 onChange={(e) => setFullName(e.target.value)}
 />
 </div>

 <div>
 <Label>
 Email <span className="text-error-500">*</span>
 </Label>
 <Input
 type="email" placeholder="name@example.com" defaultValue={email}
 onChange={(e) => setEmail(e.target.value)}
 />
 </div>

 {(role ==="mentor"|| role ==="faculty") && (
 <div>
 <Label>Expertise</Label>
 <div className="flex flex-wrap gap-2">
 {ALL_SECTORS.map((s) => (
 <button
 key={s}
 type="button" onClick={() => toggleSector(s)}
 className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
 expertise.includes(s)
 ?"bg-fellowship-navy text-white":"border border-gray-200 bg-white text-gray-600 hover:bg-gray-50")}
 >
 {s}
 </button>
 ))}
 </div>
 <p className="mt-2 text-xs text-gray-500">
 {role ==="mentor"?"Sectors this mentor will primarily support. Optional.":"Sectors whose modules this faculty member will own. Optional."}
 </p>
 </div>
 )}

 <div>
 <Label>Personal note (optional)</Label>
 <TextArea
 rows={3}
 placeholder="A short message to include in the invitation email…" value={note}
 onChange={setNote}
 />
 </div>
 </div>

 <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
 <Button variant="outline" size="sm" onClick={handleClose}>
 Cancel
 </Button>
 <Button
 variant="fellowship" size="sm" type="submit" disabled={!canSubmit}
 >
 {submitting ? "Sending…" : "Send invitation"}
 </Button>
 </div>
 </form>
 )}
 </Modal>
 );
}

function RoleOption({
 selected,
 onClick,
 title,
 description,
}: {
 selected: boolean;
 onClick: () => void;
 title: string;
 description: string;
}) {
 return (
 <button
 type="button" onClick={onClick}
 aria-pressed={selected}
 className={cn("flex flex-col rounded-lg border p-3 text-left transition-colors",
 selected
 ?"border-fellowship-navy bg-fellowship-navy/5":"border-gray-200 hover:border-gray-300")}
 >
 <span
 className={cn("text-sm font-semibold",
 selected
 ?"text-fellowship-navy":"text-gray-800")}
 >
 {title}
 </span>
 <span className="mt-0.5 text-xs text-gray-500">
 {description}
 </span>
 </button>
 );
}

function SuccessState({
 email,
 tempPassword,
 role,
 onSendAnother,
 onDone,
}: {
 email: string;
 tempPassword: string;
 role: InviteRole;
 onSendAnother: () => void;
 onDone: () => void;
}) {
 return (
 <div className="p-6 sm:p-8">
 <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-success-100">
 <CheckCircleIcon className="h-8 w-8 text-success-600"/>
 </div>
 <h2 className="mb-2 text-center text-title-sm font-bold text-gray-800">
 Account created
 </h2>
 <p className="mb-4 text-center text-sm leading-relaxed text-gray-500">
 The {role} account for{" "}
 <span className="font-semibold text-gray-700">{email}</span> is ready.
 Share these one-time credentials with them.
 </p>
 <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
   <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
     Temporary password (shown once)
   </p>
   <code className="mt-2 block break-all rounded bg-white px-3 py-2 text-sm font-mono text-gray-800">
     {tempPassword}
   </code>
   <p className="mt-2 text-xs text-amber-800">
     They should change it after their first sign-in.
   </p>
 </div>
 <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
 <Button variant="outline" size="sm" onClick={onSendAnother}>
 Invite another
 </Button>
 <Button variant="fellowship" size="sm" onClick={onDone}>
 Done
 </Button>
 </div>
 </div>
 );
}
