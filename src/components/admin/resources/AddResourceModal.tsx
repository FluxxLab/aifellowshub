"use client";
import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/SelectField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Spinner from "@/components/ui/loader/Spinner";
import { CheckCircleIcon } from "@/icons";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import {
 RESOURCE_TYPE_LABELS,
 toBackendKind,
 updateResource,
 type Resource,
 type ResourceType,
} from "@/lib/api/resources";
import { useRouter } from "next/navigation";

const TYPE_OPTIONS: ResourceType[] = ["article","pdf","video","tool","dataset","other",
];

type AdminModule = {
 id: string;
 title: string;
 weekNumber: number;
};

type AddResourceModalProps = {
 isOpen: boolean;
 onClose: () => void;
 /** When set, the modal opens in edit mode pre-filled from this row.
  *  PATCHes the row instead of POSTing a new one on submit. */
 editing?: Resource | null;
};

export default function AddResourceModal({
 isOpen,
 onClose,
 editing,
}: AddResourceModalProps) {
 const router = useRouter();
 const isEditing = Boolean(editing);
 const [title, setTitle] = useState("");
 const [type, setType] = useState<ResourceType>("article");
 const [url, setUrl] = useState("");
 const [description, setDescription] = useState("");
 const [moduleId, setModuleId] = useState("");
 const [tagsInput, setTagsInput] = useState("");
 const [submitted, setSubmitted] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [modules, setModules] = useState<AdminModule[]>([]);
 const [loadingModules, setLoadingModules] = useState(true);

 // Pre-fill when entering edit mode (or switching between rows
 // without unmounting the modal). Resetting on close is handled by
 // `reset` further down.
 useEffect(() => {
   if (!isOpen || !editing) return;
   setTitle(editing.title);
   setType(editing.type);
   setUrl(editing.url);
   setDescription(editing.description);
   setModuleId(editing.moduleId ?? "");
   setTagsInput(editing.tags.join(", "));
 }, [isOpen, editing]);

 useEffect(() => {
   if (!isOpen) return;
   let cancelled = false;
   apiFetch<{ modules: AdminModule[] }>("/modules")
     .then((res) => {
       if (cancelled) return;
       setModules(res.modules);
       if (res.modules[0]) setModuleId(res.modules[0].id);
       setLoadingModules(false);
     })
     .catch(() => {
       if (!cancelled) setLoadingModules(false);
     });
   return () => {
     cancelled = true;
   };
 }, [isOpen]);

 // Centralised validation. Each rule is computed individually so we
 // can show inline feedback against the offending field — a disabled
 // submit button without explanation is a UX trap.
 //
 // URL rule: domain-shaped (one+ dot, no whitespace). We accept both
 // `https://example.com/x` and bare `example.com/x` because admins
 // pasting from anywhere shouldn't have to remember the protocol.
 // `normaliseUrl` (used at submit) prepends `https://` when missing,
 // so the data stored is always a fully-qualified URL.
 const titleValid = title.trim().length > 1;
 const urlTrimmed = url.trim();
 const urlValid = /^(https?:\/\/)?\S+\.\S+$/.test(urlTrimmed);
 const urlTouched = urlTrimmed.length > 0;
 const moduleValid = moduleId.length > 0;
 const canSubmit = titleValid && urlValid && moduleValid && !submitting;

 const normaliseUrl = (raw: string) => {
 const trimmed = raw.trim();
 if (/^https?:\/\//i.test(trimmed)) return trimmed;
 return `https://${trimmed}`;
 };

 const reset = () => {
 setTitle("");
 setType("article");
 setUrl("");
 setDescription("");
 setModuleId(modules[0]?.id ?? "");
 setTagsInput("");
 setSubmitted(false);
 };

 const handleClose = () => {
 onClose();
 setTimeout(reset, 200);
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!canSubmit) return;
 setSubmitting(true);
 try {
   const tags = tagsInput
     .split(",")
     .map((t) => t.trim().toLowerCase())
     .filter(Boolean);
   if (isEditing && editing) {
     // PATCH the existing row. Note: we don't allow moving a resource
     // to a different module here — the backend's PATCH /resources/:id
     // doesn't accept a moduleId field. Switching modules is rare;
     // delete + recreate covers it for now.
     await updateResource(editing.id, {
       title: title.trim(),
       url: normaliseUrl(url),
       kind: toBackendKind(type),
       description: description.trim(),
       tags,
     });
     toast.success(
       "Resource updated",
       `${title.trim()} has been saved.`,
     );
   } else {
     await apiFetch(`/modules/${encodeURIComponent(moduleId)}/resources`, {
       method: "POST",
       body: {
         title: title.trim(),
         url: normaliseUrl(url),
         kind: toBackendKind(type),
         description: description.trim(),
         tags,
       },
     });
     toast.success("Resource added", `${title.trim()} is in the library.`);
   }
   setSubmitted(true);
   router.refresh();
 } catch (err) {
   toast.errorFromException(
     isEditing ? "Couldn't save changes" : "Couldn't add resource",
     err,
   );
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
 {isEditing ? "Changes saved" : "Resource added"}
 </h2>
 <p className="mb-6 text-sm leading-relaxed text-gray-500">
 <span className="font-semibold text-gray-700">
 {title}
 </span>{" "}
 {isEditing ? "has been updated." : "is now visible to fellows."}
 </p>
 <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
 {!isEditing && (
 <Button variant="outline" size="sm" onClick={reset}>
 Add another
 </Button>
 )}
 <Button variant="fellowship" size="sm" onClick={handleClose}>
 Done
 </Button>
 </div>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="p-5 sm:p-6">
 <div className="mb-4">
 <h2 className="text-title-sm font-bold text-gray-800">
 {isEditing ? "Edit resource" : "Add a resource"}
 </h2>
 <p className="mt-1 text-sm text-gray-500">
 Articles, PDFs, videos, tools, or datasets for the resource library.
 </p>
 </div>

 <div className="space-y-4">
 <div>
 <Label>
 Title <span className="text-error-500">*</span>
 </Label>
 <Input
 type="text" placeholder="e.g. AU Continental AI Strategy — annotated" defaultValue={title}
 onChange={(e) => setTitle(e.target.value)}
 />
 </div>

 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div>
 <Label>
 Type <span className="text-error-500">*</span>
 </Label>
 <SelectField<ResourceType>
 value={type}
 onChange={setType}
 options={TYPE_OPTIONS.map((t) => ({ value: t, label: RESOURCE_TYPE_LABELS[t] }))}
 />
 </div>
 <div>
 <Label>
 <span className="inline-flex items-center gap-2">
 Module <span className="text-error-500">*</span>
 {loadingModules && <Spinner size="sm" label="Loading modules…" />}
 </span>
 </Label>
 <SelectField
 value={moduleId}
 onChange={setModuleId}
 placeholder={loadingModules ? "Loading modules…" : "Choose a module"}
 options={modules.map((m) => ({
   value: m.id,
   label: `Week ${m.weekNumber} · ${m.title}`,
 }))}
 />
 </div>
 </div>

 <div>
 <Label>
 URL <span className="text-error-500">*</span>
 </Label>
 <Input
 type="url" placeholder="example.com/article" defaultValue={url}
 onChange={(e) => setUrl(e.target.value)}
 />
 {urlTouched && !urlValid ? (
 <p className="mt-1 text-xs text-error-600">
 That doesn&apos;t look like a URL — needs at least one dot
 (e.g. <code>example.com</code>).
 </p>
 ) : (
 <p className="mt-1 text-xs text-gray-500">
 We&apos;ll add <code>https://</code> for you if you don&apos;t.
 </p>
 )}
 </div>

 <div>
 <Label>Description</Label>
 <TextArea
 rows={2}
 placeholder="One-paragraph summary fellows will see…" value={description}
 onChange={setDescription}
 />
 </div>

 <div>
 <Label>Tags</Label>
 <Input
 type="text" placeholder="Comma-separated, e.g. UNESCO, ethics, framework" defaultValue={tagsInput}
 onChange={(e) => setTagsInput(e.target.value)}
 />
 </div>
 </div>

 <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
 <Button variant="outline" size="sm" onClick={handleClose}>
 Cancel
 </Button>
 <Button
 variant="fellowship" size="sm" type="submit" disabled={!canSubmit}
 >
 {submitting
   ? isEditing ? "Saving…" : "Adding…"
   : isEditing ? "Save changes" : "Add resource"}
 </Button>
 </div>
 </form>
 )}
 </Modal>
 );
}
