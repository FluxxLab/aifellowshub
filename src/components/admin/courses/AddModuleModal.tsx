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
import { createModule } from "@/lib/api/faculty";

// Frontend-only categorisation for now — the backend `Module` schema doesn't
// have a `category` column. If categories become a backend concept, swap this
// for a fetched list. Four tracks mirror the AI Fellowship curriculum arc:
// foundations → core skills → capstone work → showcase.
const COMMON_CATEGORIES = [
  "Foundations",
  "Core Competencies",
  "Capstone & Implementation",
  "Completion & Showcase",
];

type AddModuleModalProps = {
 isOpen: boolean;
 onClose: () => void;
 /** The course this module belongs to. Required so backend can attach it. */
 courseId: string;
 /** Suggested next week number — usually`modules.length + 1`. */
 nextWeekNumber: number;
};

export default function AddModuleModal({
 isOpen,
 onClose,
 courseId,
 nextWeekNumber,
}: AddModuleModalProps) {
 const router = useRouter();
 const [title, setTitle] = useState("");
 const [weekNumber, setWeekNumber] = useState(nextWeekNumber);
 const [category, setCategory] = useState(COMMON_CATEGORIES[0]);
 const [summary, setSummary] = useState("");
 const [submitted, setSubmitted] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [error, setError] = useState<string | null>(null);

 // Week 0 is valid (orientation/onboarding); only block negatives or NaN.
 const canSubmit =
 title.trim().length > 1 &&
 Number.isInteger(weekNumber) &&
 weekNumber >= 0;

 const reset = () => {
 setTitle("");
 setWeekNumber(nextWeekNumber);
 setCategory(COMMON_CATEGORIES[0]);
 setSummary("");
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
 await createModule({
 courseId,
 weekNumber,
 title: title.trim(),
 summary: summary.trim() || title.trim(),
 });
 setSubmitted(true);
 // Refresh the parent server component so the new module appears in the list.
 router.refresh();
 } catch (err) {
 setError(err instanceof Error ? err.message : "Couldn't add the module.");
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
 Module added
 </h2>
 <p className="mb-6 text-sm leading-relaxed text-gray-500">
 <span className="font-semibold text-gray-700">
 {title}
 </span>{" "}
 is in draft. Open the module editor to add learning objectives,
 activities, and link a session.
 </p>
 <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
 <Button variant="outline" size="sm" onClick={reset}>
 Add another
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
 Add a module
 </h2>
 <p className="mt-1 text-sm text-gray-500">
 You can fill in objectives, activities, and a linked session in
 the module editor afterwards.
 </p>
 </div>

 <div className="space-y-5">
 <div>
 <Label>
 Title <span className="text-error-500">*</span>
 </Label>
 <Input
 type="text" placeholder="e.g. Algorithmic Justice" defaultValue={title}
 onChange={(e) => setTitle(e.target.value)}
 />
 </div>

 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div>
 <Label>
 Week number <span className="text-error-500">*</span>
 </Label>
 <Input
 type="number" min="0" defaultValue={String(weekNumber)}
 onChange={(e) => setWeekNumber(Number(e.target.value))}
 />
 <p className="mt-1 text-xs text-gray-500">
 Use <span className="font-semibold">0</span> for an onboarding /
 orientation module that runs before week 1.
 </p>
 </div>
 <div>
 <Label>Category</Label>
 <SelectField
 value={category}
 onChange={setCategory}
 options={COMMON_CATEGORIES.map((c) => ({ value: c, label: c }))}
 />
 </div>
 </div>

 <div>
 <Label>Summary</Label>
 <TextArea
 rows={3}
 placeholder="One-paragraph description fellows will see…" value={summary}
 onChange={setSummary}
 />
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
 {submitting ? "Adding…" : "Add module"}
 </Button>
 </div>
 </form>
 )}
 </Modal>
 );
}
