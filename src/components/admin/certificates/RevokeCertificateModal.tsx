"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { apiFetch } from "@/lib/api/client";
import type { IssuedCertificate } from "@/lib/api/certificates";
import { toast } from "@/lib/toast";

type RevokeCertificateModalProps = {
 /** The certificate to revoke; `null` keeps the modal closed. */
 cert: IssuedCertificate | null;
 onClose: () => void;
};

/**
 * Confirm + reason for revoking a certificate. The reason is shown on the
 * public verify page, so the copy warns the admin about that.
 */
export default function RevokeCertificateModal({
 cert,
 onClose,
}: RevokeCertificateModalProps) {
 const router = useRouter();
 const [reason, setReason] = useState("");
 const [submitting, setSubmitting] = useState(false);

 const handleClose = () => {
 onClose();
 setTimeout(() => setReason(""), 200);
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!cert) return;
 setSubmitting(true);
 try {
 await apiFetch(`/certificates/${encodeURIComponent(cert.id)}/revoke`, {
 method: "POST",
 body: { reason: reason.trim() },
 });
 toast.success("Certificate revoked", cert.certificateNumber);
 router.refresh();
 handleClose();
 } catch (err) {
 toast.errorFromException("Couldn't revoke certificate", err);
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <Modal isOpen={cert !== null} onClose={handleClose} className="m-4 max-w-lg">
 <form onSubmit={handleSubmit} className="p-6 sm:p-8">
 <div className="mb-6">
 <h2 className="text-title-sm font-bold text-gray-800">
 Revoke certificate
 </h2>
 <p className="mt-1 text-sm text-gray-500">
 {cert?.fellowName}&apos;s certificate{" "}
 <span className="font-mono text-xs">{cert?.certificateNumber}</span>{" "}
 will show as revoked to anyone who verifies it. The reason below
 is shown publicly. You can restore it later.
 </p>
 </div>

 <div>
 <Label>
 Reason <span className="text-error-500">*</span>
 </Label>
 <TextArea
 rows={3}
 value={reason}
 onChange={setReason}
 placeholder="e.g. Issued in error."
 />
 </div>

 <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
 <Button variant="outline" size="sm" onClick={handleClose}>
 Cancel
 </Button>
 <Button
 variant="fellowship"
 size="sm"
 type="submit"
 disabled={reason.trim().length < 3 || submitting}
 >
 {submitting ? "Revoking…" : "Revoke certificate"}
 </Button>
 </div>
 </form>
 </Modal>
 );
}
