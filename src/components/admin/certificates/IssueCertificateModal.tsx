"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

export type IssuableFellow = { id: string; fullName: string; email: string };

type Scorecard = { eligible: boolean; missingRequirements: string[] };

type IssueCertificateModalProps = {
 isOpen: boolean;
 onClose: () => void;
 /** Fellows who don't have a certificate yet. */
 fellows: IssuableFellow[];
};

/**
 * Admin override: issue a certificate by hand. The backend skips the
 * automatic eligibility rules, so we show any unmet requirements before
 * the admin confirms, and require a reason for the audit log.
 */
export default function IssueCertificateModal({
 isOpen,
 onClose,
 fellows,
}: IssueCertificateModalProps) {
 const router = useRouter();
 const [search, setSearch] = useState("");
 const [selectedId, setSelectedId] = useState<string | null>(null);
 const [reason, setReason] = useState("");
 const [scorecard, setScorecard] = useState<Scorecard | null>(null);
 const [scorecardLoading, setScorecardLoading] = useState(false);
 const [submitting, setSubmitting] = useState(false);

 const selected = fellows.find((f) => f.id === selectedId) ?? null;

 const matches = useMemo(() => {
 const q = search.trim().toLowerCase();
 const list = q
 ? fellows.filter(
 (f) =>
 f.fullName.toLowerCase().includes(q) ||
 f.email.toLowerCase().includes(q),
 )
 : fellows;
 return list.slice(0, 50);
 }, [fellows, search]);

 // Load the selected fellow's scorecard so the admin can see what they're overriding.
 useEffect(() => {
 if (!selectedId) {
 setScorecard(null);
 return;
 }
 const ctrl = new AbortController();
 setScorecardLoading(true);
 apiFetch<Scorecard>(
 `/admin/fellows/${encodeURIComponent(selectedId)}/certification`,
 { signal: ctrl.signal },
 )
 .then(setScorecard)
 .catch(() => setScorecard(null))
 .finally(() => {
 if (!ctrl.signal.aborted) setScorecardLoading(false);
 });
 return () => ctrl.abort();
 }, [selectedId]);

 const handleClose = () => {
 onClose();
 setTimeout(() => {
 setSearch("");
 setSelectedId(null);
 setReason("");
 setScorecard(null);
 }, 200);
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!selected) return;
 setSubmitting(true);
 try {
 const res = await apiFetch<{ certificate: { certificateNumber: string } }>(
 `/admin/fellows/${encodeURIComponent(selected.id)}/certificate`,
 { method: "POST", body: { reason: reason.trim() } },
 );
 toast.success(
 "Certificate issued",
 `${selected.fullName} · ${res.certificate.certificateNumber}`,
 );
 router.refresh();
 handleClose();
 } catch (err) {
 toast.errorFromException("Couldn't issue certificate", err);
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <Modal isOpen={isOpen} onClose={handleClose} className="m-4 max-w-lg">
 <form onSubmit={handleSubmit} className="p-6 sm:p-8">
 <div className="mb-6">
 <h2 className="text-title-sm font-bold text-gray-800">
 Issue certificate manually
 </h2>
 <p className="mt-1 text-sm text-gray-500">
 This skips the automatic eligibility rules. The fellow is emailed
 their certificate, and your reason is kept in the audit log.
 </p>
 </div>

 <div className="space-y-5">
 <div>
 <Label>
 Fellow <span className="text-error-500">*</span>
 </Label>
 {selected ? (
 <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-2.5">
 <div className="min-w-0">
 <div className="truncate text-sm font-semibold text-gray-800">
 {selected.fullName}
 </div>
 <div className="truncate text-xs text-gray-500">
 {selected.email}
 </div>
 </div>
 <button
 type="button"
 onClick={() => setSelectedId(null)}
 className="text-sm font-medium text-fellowship-navy hover:underline"
 >
 Change
 </button>
 </div>
 ) : (
 <>
 <input
 type="search"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search by name or email…"
 className="h-10 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-none focus:ring-3 focus:ring-fellowship-navy/10"
 />
 <ul className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-100">
 {matches.length === 0 ? (
 <li className="px-4 py-3 text-sm text-gray-500">
 {fellows.length === 0
 ? "Every fellow already has a certificate."
 : "No fellows match."}
 </li>
 ) : (
 matches.map((f) => (
 <li key={f.id}>
 <button
 type="button"
 onClick={() => setSelectedId(f.id)}
 className="block w-full px-4 py-2 text-left hover:bg-gray-50"
 >
 <span className="block text-sm font-medium text-gray-800">
 {f.fullName}
 </span>
 <span className="block text-xs text-gray-500">
 {f.email}
 </span>
 </button>
 </li>
 ))
 )}
 </ul>
 </>
 )}
 </div>

 {selected && (
 <div
 className={cn(
 "rounded-lg px-4 py-3 text-sm",
 scorecard && !scorecard.eligible
 ? "bg-warning-50 text-warning-700"
 : "bg-gray-50 text-gray-600",
 )}
 >
 {scorecardLoading ? (
 "Checking eligibility…"
 ) : !scorecard ? (
 "Couldn't load this fellow's eligibility."
 ) : scorecard.eligible ? (
 "This fellow meets every requirement. The certificate should normally be issued automatically."
 ) : (
 <>
 <span className="font-semibold">Not yet eligible:</span>
 <ul className="mt-1 list-disc pl-5">
 {scorecard.missingRequirements.map((m) => (
 <li key={m}>{m}</li>
 ))}
 </ul>
 </>
 )}
 </div>
 )}

 <div>
 <Label>
 Reason <span className="text-error-500">*</span>
 </Label>
 <TextArea
 rows={3}
 value={reason}
 onChange={setReason}
 placeholder="e.g. Capstone assessed offline by the programme director."
 />
 </div>
 </div>

 <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
 <Button variant="outline" size="sm" onClick={handleClose}>
 Cancel
 </Button>
 <Button
 variant="fellowship"
 size="sm"
 type="submit"
 disabled={!selected || reason.trim().length < 3 || submitting}
 >
 {submitting ? "Issuing…" : "Issue certificate"}
 </Button>
 </div>
 </form>
 </Modal>
 );
}
