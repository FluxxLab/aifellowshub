"use client";
import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import SelectField from "@/components/form/SelectField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/loader/Spinner";
import { ChevronRightIcon } from "@/icons";
import { apiFetch } from "@/lib/api/client";
import { useRouter } from "next/navigation";

type AdminModule = {
 id: string;
 title: string;
 weekNumber: number;
};

type CreateAssessmentModalProps = {
 isOpen: boolean;
 onClose: () => void;
};

/**
 * Each module has at most one assessment (Assessment.moduleId @unique).
 * Faculty manage questions + pass mark inside the module editor, so the
 * admin's "Create assessment" entry point is really "pick a module to
 * configure". We send them to the faculty editor for the chosen module.
 */
export default function CreateAssessmentModal({
 isOpen,
 onClose,
}: CreateAssessmentModalProps) {
 const router = useRouter();
 const [moduleId, setModuleId] = useState("");
 const [modules, setModules] = useState<AdminModule[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
   if (!isOpen) return;
   let cancelled = false;
   apiFetch<{ modules: AdminModule[] }>("/modules")
     .then((res) => {
       if (cancelled) return;
       setModules(res.modules);
       if (res.modules[0]) setModuleId(res.modules[0].id);
       setLoading(false);
     })
     .catch(() => {
       if (!cancelled) setLoading(false);
     });
   return () => {
     cancelled = true;
   };
 }, [isOpen]);

 const canSubmit = moduleId.length > 0 && !loading;

 const handleClose = () => {
 onClose();
 };

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!canSubmit) return;
 onClose();
 router.push(`/faculty/modules/${encodeURIComponent(moduleId)}`);
 };

 return (
 <Modal isOpen={isOpen} onClose={handleClose} className="m-4 max-w-lg">
 <form onSubmit={handleSubmit} className="p-6 sm:p-8">
 <div className="mb-6">
 <h2 className="text-title-sm font-bold text-gray-800">
 Configure an assessment
 </h2>
 <p className="mt-1 text-sm text-gray-500">
 Each module has one assessment. Pick a module to manage its
 questions, pass mark, and time limit in the module editor.
 </p>
 </div>

 <div className="space-y-5">
 <div>
 <Label>
 <span className="inline-flex items-center gap-2">
 Module <span className="text-error-500">*</span>
 {loading && <Spinner size="sm" label="Loading modules…" />}
 </span>
 </Label>
 <SelectField
 value={moduleId}
 onChange={setModuleId}
 placeholder={loading ? "Loading modules…" : "Choose a module"}
 options={modules.map((m) => ({
   value: m.id,
   label: `Week ${m.weekNumber} · ${m.title}`,
 }))}
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
 Open module editor
 <ChevronRightIcon className="h-4 w-4" />
 </Button>
 </div>
 </form>
 </Modal>
 );
}
