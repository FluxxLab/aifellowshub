"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/SelectField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { CheckCircleIcon } from "@/icons";
import { createCourse } from "@/lib/api/courses";

// Faculty roster — phase 2 will fetch from /users?role=faculty.
// For now, "self" creates the course owned by the current user (default in
// the backend if ownerId is omitted), or pick from the seeded demo faculty.
const FACULTY = [
 { id:"", name:"Me (current user)"},
];

type CreateCourseModalProps = {
 isOpen: boolean;
 onClose: () => void;
};

export default function CreateCourseModal({
 isOpen,
 onClose,
}: CreateCourseModalProps) {
 const router = useRouter();
 const [title, setTitle] = useState("");
 const [description, setDescription] = useState("");
 const [ownerId, setOwnerId] = useState(FACULTY[0].id);
 const [submitted, setSubmitted] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const canSubmit = title.trim().length > 1;

 const reset = () => {
 setTitle("");
 setDescription("");
 setOwnerId(FACULTY[0].id);
 setSubmitted(false);
 setError(null);
 };

 const handleClose = () => {
 onClose();
 setTimeout(reset, 200);
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!canSubmit || submitting) return;
 setSubmitting(true);
 setError(null);
 try {
 await createCourse({
   title: title.trim(),
   description: description.trim() || title.trim(),
   ownerId: ownerId || undefined,
 });
 setSubmitted(true);
 // Refresh the parent server component so the new course appears in the list.
 router.refresh();
 } catch (err) {
 setError(err instanceof Error ? err.message : "Couldn't create the course.");
 }
 setSubmitting(false);
 };

 return (
 <Modal isOpen={isOpen} onClose={handleClose} className="m-4 max-w-lg">
 {submitted ? (
 <div className="p-6 text-center sm:p-8">
 <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-success-100">
 <CheckCircleIcon className="h-8 w-8 text-success-600"/>
 </div>
 <h2 className="mb-2 text-title-sm font-bold text-gray-800">
 Course created
 </h2>
 <p className="mb-6 text-sm leading-relaxed text-gray-500">
 <span className="font-semibold text-gray-700">
 {title}
 </span>{" "}
 is in draft. The owner can start adding modules now.
 </p>
 <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
 <Button variant="outline" size="sm" onClick={reset}>
 Create another
 </Button>
 <Button variant="fellowship" size="sm" onClick={handleClose}>
 Done
 </Button>
 </div>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="p-6 sm:p-8">
 <div className="mb-6">
 <h2 className="text-title-sm font-bold text-gray-800">
 Create a new course
 </h2>
 <p className="mt-1 text-sm text-gray-500">
 The owner can add modules and publish when ready.
 </p>
 </div>

 <div className="space-y-5">
 <div>
 <Label>
 Title <span className="text-error-500">*</span>
 </Label>
 <Input
 type="text" placeholder="e.g. Data Sovereignty in African AI" defaultValue={title}
 onChange={(e) => setTitle(e.target.value)}
 />
 </div>

 <div>
 <Label>Description</Label>
 <TextArea
 rows={3}
 placeholder="What this course covers and who it's for…" value={description}
 onChange={setDescription}
 />
 </div>

 <div>
 <Label>
 Owner <span className="text-error-500">*</span>
 </Label>
 <SelectField
 value={ownerId}
 onChange={setOwnerId}
 options={FACULTY.map((f) => ({ value: f.id, label: f.name }))}
 placeholder="Select owner"
 />
 <p className="mt-2 text-xs text-gray-500">
 Owners curate the course content. You can reassign later.
 </p>
 </div>
 </div>

 {error && (
 <p className="mt-4 rounded-md bg-error-50 p-2 text-xs font-medium text-error-700">
 {error}
 </p>
 )}
 <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
 <Button variant="outline" size="sm" onClick={handleClose}>
 Cancel
 </Button>
 <Button
 variant="fellowship" size="sm" type="submit" disabled={!canSubmit || submitting}
 >
 {submitting ? "Creating…" : "Create course"}
 </Button>
 </div>
 </form>
 )}
 </Modal>
 );
}
