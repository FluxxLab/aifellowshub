"use client";
import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { CheckCircleIcon } from "@/icons";
import { apiFetch } from "@/lib/api/client";
import type { CertificateTemplate } from "@/lib/api/certificates";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";

type EditTemplateModalProps = {
 isOpen: boolean;
 onClose: () => void;
 template: CertificateTemplate;
};

export default function EditTemplateModal({
 isOpen,
 onClose,
 template,
}: EditTemplateModalProps) {
 const router = useRouter();
 const [title, setTitle] = useState(template.title);
 const [bodyText, setBodyText] = useState(template.bodyText);
 const [signatoryName, setSignatoryName] = useState(template.signatoryName);
 const [signatoryTitle, setSignatoryTitle] = useState(template.signatoryTitle);
 const [submitted, setSubmitted] = useState(false);
 const [submitting, setSubmitting] = useState(false);

 const handleClose = () => {
 onClose();
 setTimeout(() => {
 setTitle(template.title);
 setBodyText(template.bodyText);
 setSignatoryName(template.signatoryName);
 setSignatoryTitle(template.signatoryTitle);
 setSubmitted(false);
 }, 200);
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setSubmitting(true);
 try {
   const signatures =
     signatoryName.trim() || signatoryTitle.trim()
       ? [
           {
             name: signatoryName.trim(),
             role: signatoryTitle.trim(),
           },
         ]
       : [];
   await apiFetch("/certificate-templates/default", {
     method: "PATCH",
     body: {
       name: title.trim(),
       htmlBody: bodyText,
       signatures,
     },
   });
   setSubmitted(true);
   toast.success("Template saved");
   router.refresh();
 } catch (err) {
   toast.errorFromException("Couldn't save template", err);
 } finally {
   setSubmitting(false);
 }
 };

 return (
 <Modal isOpen={isOpen} onClose={handleClose} className="m-4 max-w-lg">
 {submitted ? (
 <div className="p-6 text-center sm:p-8">
 <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-success-100">
 <CheckCircleIcon className="h-8 w-8 text-success-600"/>
 </div>
 <h2 className="mb-2 text-title-sm font-bold text-gray-800">
 Template updated
 </h2>
 <p className="mb-6 text-sm leading-relaxed text-gray-500">
 Future certificates will use the new template. Already-issued
 certificates are unchanged unless reissued.
 </p>
 <Button variant="fellowship" size="sm" onClick={handleClose}>
 Done
 </Button>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="p-6 sm:p-8">
 <div className="mb-6">
 <h2 className="text-title-sm font-bold text-gray-800">
 Edit certificate template
 </h2>
 <p className="mt-1 text-sm text-gray-500">
 Use{" "}
 <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
 {"{{fellow_name}}"}
 </code>
 ,{" "}
 <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
 {"{{course_title}}"}
 </code>
 , and{" "}
 <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
 {"{{issued_date}}"}
 </code>{" "}
 in the body.
 </p>
 </div>

 <div className="space-y-5">
 <div>
 <Label>
 Title <span className="text-error-500">*</span>
 </Label>
 <Input
 type="text" defaultValue={title}
 onChange={(e) => setTitle(e.target.value)}
 />
 </div>
 <div>
 <Label>
 Body text <span className="text-error-500">*</span>
 </Label>
 <TextArea
 rows={5}
 value={bodyText}
 onChange={setBodyText}
 />
 </div>
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div>
 <Label>Signatory name</Label>
 <Input
 type="text" defaultValue={signatoryName}
 onChange={(e) => setSignatoryName(e.target.value)}
 />
 </div>
 <div>
 <Label>Signatory title</Label>
 <Input
 type="text" defaultValue={signatoryTitle}
 onChange={(e) => setSignatoryTitle(e.target.value)}
 />
 </div>
 </div>
 </div>

 <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
 <Button variant="outline" size="sm" onClick={handleClose}>
 Cancel
 </Button>
 <Button
 variant="fellowship" size="sm" type="submit" disabled={
   title.trim().length < 2 ||
   bodyText.trim().length < 10 ||
   submitting
 }
 >
 {submitting ? "Saving…" : "Save template"}
 </Button>
 </div>
 </form>
 )}
 </Modal>
 );
}
