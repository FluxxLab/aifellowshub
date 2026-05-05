"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { MoreDotIcon, PlusIcon } from "@/icons";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Module } from "@/lib/api/courses";
import {
  approveModule,
  createModule,
  deleteModule,
  returnModule,
} from "@/lib/api/faculty";
import AddModuleModal from "./AddModuleModal";

const ITEM_TYPE ="MODULE";

type ModuleListProps = {
 courseId: string;
 initialModules: Module[];
 onPublishedCountChange?: (n: number) => void;
};

export default function ModuleList({ courseId, initialModules }: ModuleListProps) {
 const router = useRouter();
 const [modules, setModules] = useState<Module[]>(initialModules);
 const [addOpen, setAddOpen] = useState(false);
 const { confirm, dialog: confirmDialog } = useConfirm();

 // Sync local state when the server re-fetches (after `router.refresh()`).
 // Without this, useState ignores subsequent `initialModules` changes and the
 // list stays stale until a hard reload.
 useEffect(() => {
   setModules(initialModules);
 }, [initialModules]);

 const moveModule = (from: number, to: number) => {
 // Local-only reorder for now — phase 2 will POST to a /modules/reorder
 // endpoint so the new orderIndex sticks across reloads.
 setModules((prev) => {
 const next = [...prev];
 const [moved] = next.splice(from, 1);
 next.splice(to, 0, moved);
 return next.map((m, i) => ({
 ...m,
 weekNumber: i + 1,
 orderIndex: i,
 }));
 });
 };

 const togglePublish = async (m: Module) => {
 try {
 // Backend status flow: draft ↔ published (admin uses publish/return verbs).
 if (m.isPublished) {
 await returnModule(m.id);
 } else {
 await approveModule(m.id);
 }
 router.refresh();
 } catch (err) {
 toast.errorFromException("Couldn't change module status", err);
 }
 };

 const removeModule = async (m: Module) => {
 const ok = await confirm({
 title: `Delete "${m.title}"?`,
 message: "This can't be undone. The module and its lessons will be removed.",
 confirmLabel: "Delete module",
 tone: "danger",
 });
 if (!ok) return;
 try {
 await deleteModule(m.id);
 toast.success("Module deleted");
 router.refresh();
 } catch (err) {
 toast.errorFromException("Couldn't delete the module", err);
 }
 };

 const duplicateModule = async (m: Module) => {
 try {
 const nextWeek = (modules[modules.length - 1]?.weekNumber ?? 0) + 1;
 await createModule({
 courseId,
 weekNumber: nextWeek,
 title: `${m.title} (copy)`,
 summary: m.summary,
 });
 toast.success("Module duplicated");
 router.refresh();
 } catch (err) {
 toast.errorFromException("Couldn't duplicate the module", err);
 }
 };

 const editModule = (m: Module) => {
 // The faculty module editor is the shared edit surface. Admin has the
 // same permissions on PATCH /modules/:id so this works for both roles.
 router.push(`/faculty/modules/${m.id}`);
 };

 const previewAsFellow = (m: Module) => {
 router.push(`/learning/${m.weekNumber}`);
 };

 return (
 <>
 <section className="rounded-2xl border border-gray-200 bg-white">
 <header className="flex items-start justify-between gap-3 px-5 py-5 sm:px-6">
 <div>
 <h2 className="text-base font-semibold text-gray-800">
 Modules
 </h2>
 <p className="mt-1 text-sm text-gray-500">
 Drag to reorder. Toggle publish per module to control fellow access.
 </p>
 </div>
 <Button
 variant="fellowship" size="sm" startIcon={<PlusIcon />}
 onClick={() => setAddOpen(true)}
 >
 Add module
 </Button>
 </header>

 <div className="border-t border-gray-100">
 {modules.length === 0 ? (
 <div className="px-6 py-12 text-center text-sm text-gray-500">
 No modules yet. Add the first one to get started.
 </div>
 ) : (
 <DndProvider backend={HTML5Backend}>
 <ul className="flex flex-col">
 {modules.map((m, i) => (
 <ModuleRow
 key={m.id}
 module={m}
 index={i}
 moveModule={moveModule}
 togglePublish={() => togglePublish(m)}
 onDelete={() => removeModule(m)}
 onEdit={() => editModule(m)}
 onDuplicate={() => duplicateModule(m)}
 onPreview={() => previewAsFellow(m)}
 />
 ))}
 </ul>
 </DndProvider>
 )}
 </div>
 </section>

 <AddModuleModal
 isOpen={addOpen}
 onClose={() => setAddOpen(false)}
 courseId={courseId}
 nextWeekNumber={modules.length + 1}
 />
 {confirmDialog}
 </>
 );
}

type ModuleRowProps = {
 module: Module;
 index: number;
 moveModule: (from: number, to: number) => void;
 togglePublish: () => void;
 onDelete: () => void;
 onEdit: () => void;
 onDuplicate: () => void;
 onPreview: () => void;
};

function ModuleRow({
 module: m,
 index,
 moveModule,
 togglePublish,
 onDelete,
 onEdit,
 onDuplicate,
 onPreview,
}: ModuleRowProps) {
 const ref = useRef<HTMLLIElement | null>(null);
 const handleRef = useRef<HTMLButtonElement | null>(null);
 const [menuOpen, setMenuOpen] = useState(false);

 const [, drop] = useDrop<{ index: number }>({
 accept: ITEM_TYPE,
 hover(item) {
 if (item.index !== index) {
 moveModule(item.index, index);
 item.index = index;
 }
 },
 });

 const [{ isDragging }, drag, preview] = useDrag({
 type: ITEM_TYPE,
 item: { index },
 collect: (monitor) => ({ isDragging: monitor.isDragging() }),
 });

 // react-dnd connector functions are designed to be called with refs at
 // render time — the lint rule for ref-during-render doesn't model this
 // correctly. Suppress for the two canonical react-dnd hookups.
 // eslint-disable-next-line react-hooks/refs
 preview(drop(ref));
 // eslint-disable-next-line react-hooks/refs
 drag(handleRef);

 return (
 <li
 ref={ref}
 className={cn("flex items-center gap-3 border-b border-gray-100 px-5 py-3 transition-colors last:border-b-0 sm:px-6",
 isDragging
 ?"opacity-30":"hover:bg-gray-50")}
 >
 <button
 ref={handleRef}
 type="button" aria-label={`Drag to reorder ${m.title}`}
 className="flex h-8 w-6 cursor-grab items-center justify-center text-gray-300 hover:text-gray-500 active:cursor-grabbing">
 <GripIcon />
 </button>

 <div className="flex w-10 shrink-0 items-center justify-center text-xs font-semibold tabular-nums text-fellowship-navy">
 W{String(m.weekNumber).padStart(2,"0")}
 </div>

 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <span className="truncate text-sm font-semibold text-gray-800">
 {m.title}
 </span>
 <Badge color="light">{m.category}</Badge>
 </div>
 <p className="mt-0.5 truncate text-xs text-gray-500">
 {m.summary}
 </p>
 </div>

 <button
 type="button" onClick={togglePublish}
 className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
 m.isPublished
 ?"bg-success-50 text-success-700 hover:bg-success-100":"bg-gray-100 text-gray-600 hover:bg-gray-200")}
 title={m.isPublished ?"Click to unpublish":"Click to publish"}
 >
 {m.isPublished ?"Published":"Draft"}
 </button>

 <div className="relative">
 <button
 type="button" aria-label={`Actions for ${m.title}`}
 aria-haspopup="menu" aria-expanded={menuOpen}
 onClick={() => setMenuOpen((v) => !v)}
 className="dropdown-toggle inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800">
 <MoreDotIcon className="h-5 w-5"/>
 </button>
 <Dropdown
 isOpen={menuOpen}
 onClose={() => setMenuOpen(false)}
 className="w-44 p-1">
 <ul role="menu" className="flex flex-col gap-0.5">
 <MenuItem
 onClick={() => {
 onEdit();
 setMenuOpen(false);
 }}
 >
 Edit module
 </MenuItem>
 <MenuItem
 onClick={() => {
 onDuplicate();
 setMenuOpen(false);
 }}
 >
 Duplicate
 </MenuItem>
 <MenuItem
 onClick={() => {
 onPreview();
 setMenuOpen(false);
 }}
 >
 Preview as fellow
 </MenuItem>
 <MenuItem
 destructive
 onClick={() => {
 onDelete();
 setMenuOpen(false);
 }}
 >
 Delete
 </MenuItem>
 </ul>
 </Dropdown>
 </div>
 </li>
 );
}

function MenuItem({
 children,
 onClick,
 destructive,
}: {
 children: React.ReactNode;
 onClick: () => void;
 destructive?: boolean;
}) {
 return (
 <li role="none">
 <DropdownItem
 onClick={onClick}
 baseClassName="block w-full rounded-md text-left px-3 py-2 text-sm font-medium transition-colors" className={
 destructive
 ?"text-error-600 hover:bg-error-50":"text-gray-700 hover:bg-gray-100 hover:text-gray-900"}
 >
 {children}
 </DropdownItem>
 </li>
 );
}

function GripIcon() {
 return (
 <svg
 width="14" height="20" viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden
 >
 <circle cx="4" cy="4" r="1.5" fill="currentColor"/>
 <circle cx="10" cy="4" r="1.5" fill="currentColor"/>
 <circle cx="4" cy="10" r="1.5" fill="currentColor"/>
 <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
 <circle cx="4" cy="16" r="1.5" fill="currentColor"/>
 <circle cx="10" cy="16" r="1.5" fill="currentColor"/>
 </svg>
 );
}
