"use client";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import {
 Table,
 TableBody,
 TableCell,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import MobileRowCard, {
 MobileRowList,
} from "@/components/ui/table/MobileRowCard";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { MoreDotIcon, PlusIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import {
 RESOURCE_TYPE_LABELS,
 deleteResource,
 type Resource,
 type ResourceType,
} from "@/lib/api/resources";
import AddResourceModal from "./AddResourceModal";

const TYPE_FILTERS: { id:"all"| ResourceType; label: string }[] = [
 { id:"all", label:"All"},
 { id:"article", label:"Articles"},
 { id:"pdf", label:"PDFs"},
 { id:"video", label:"Videos"},
 { id:"tool", label:"Tools"},
 { id:"dataset", label:"Datasets"},
 { id:"other", label:"Other"},
];

type ResourcesViewProps = {
 resources: Resource[];
};

export default function ResourcesView({ resources }: ResourcesViewProps) {
 const router = useRouter();
 const { confirm, dialog: confirmDialog } = useConfirm();
 const [filter, setFilter] = useState<(typeof TYPE_FILTERS)[number]["id"]>("all");
 const [search, setSearch] = useState("");
 // `modalOpen` covers both create + edit; `editing` toggles the modal
 // into edit mode for that specific row. Sharing one modal avoids
 // duplicated form code and keeps focus management trivial.
 const [modalOpen, setModalOpen] = useState(false);
 const [editing, setEditing] = useState<Resource | null>(null);

 const visible = useMemo(() => {
 const q = search.trim().toLowerCase();
 return resources.filter((r) => {
 if (filter !=="all"&& r.type !== filter) return false;
 if (q) {
 return (
 r.title.toLowerCase().includes(q) ||
 (r.moduleTitle ??"").toLowerCase().includes(q) ||
 r.tags.some((t) => t.toLowerCase().includes(q))
 );
 }
 return true;
 });
 }, [resources, filter, search]);

 const openAdd = () => {
   setEditing(null);
   setModalOpen(true);
 };
 const openEdit = (resource: Resource) => {
   setEditing(resource);
   setModalOpen(true);
 };
 const closeModal = () => {
   setModalOpen(false);
   // Clear editing state after the close animation so the modal
   // doesn't re-render its "create" copy mid-fade.
   setTimeout(() => setEditing(null), 200);
 };

 const handleDelete = async (resource: Resource) => {
   const ok = await confirm({
     title: `Delete "${resource.title}"?`,
     message:
       "Fellows will no longer see this resource in the library. This can't be undone.",
     confirmLabel: "Delete resource",
     tone: "danger",
   });
   if (!ok) return;
   try {
     await deleteResource(resource.id);
     toast.success("Resource deleted", `${resource.title} is gone.`);
     router.refresh();
   } catch (err) {
     toast.errorFromException("Couldn't delete resource", err);
   }
 };

 return (
 <>
 <div className="flex flex-col gap-4">
 <Header
 total={resources.length}
 onAdd={openAdd}
 />
 <Toolbar
 filter={filter}
 setFilter={setFilter}
 search={search}
 setSearch={setSearch}
 />
 <ResourcesTable
 resources={visible}
 onEdit={openEdit}
 onDelete={handleDelete}
 />
 </div>
 <AddResourceModal
   isOpen={modalOpen}
   onClose={closeModal}
   editing={editing}
 />
 {confirmDialog}
 </>
 );
}

function Header({ total, onAdd }: { total: number; onAdd: () => void }) {
 return (
 <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
 <div>
 <h1 className="text-title-md font-bold text-gray-800">
 Resource library
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 {total} resources across the curriculum. Faculty curates; admin
 oversees.
 </p>
 </div>
 <Button
 variant="fellowship" size="sm" startIcon={<PlusIcon />}
 onClick={onAdd}
 >
 Add resource
 </Button>
 </div>
 );
}

function Toolbar({
 filter,
 setFilter,
 search,
 setSearch,
}: {
 filter: (typeof TYPE_FILTERS)[number]["id"];
 setFilter: (f: (typeof TYPE_FILTERS)[number]["id"]) => void;
 search: string;
 setSearch: (s: string) => void;
}) {
 return (
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <input
 type="search" value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search by title, module, or tag…" className="h-10 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-none focus:ring-3 focus:ring-fellowship-navy/10 sm:max-w-xs"/>
 <div className="flex flex-wrap gap-2">
 {TYPE_FILTERS.map((f) => (
 <button
 key={f.id}
 onClick={() => setFilter(f.id)}
 className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
 filter === f.id
 ?"bg-fellowship-navy text-white":"border border-gray-200 bg-white text-gray-600 hover:bg-gray-50")}
 >
 {f.label}
 </button>
 ))}
 </div>
 </div>
 );
}

function ResourcesTable({
 resources,
 onEdit,
 onDelete,
}: {
 resources: Resource[];
 onEdit: (resource: Resource) => void;
 onDelete: (resource: Resource) => void;
}) {
 if (resources.length === 0) {
 return (
 <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
 No resources match.
 </div>
 );
 }

 return (
 <>
 <MobileRowList>
 {resources.map((r) => (
 <MobileRowCard
 key={r.id}
 header={
 <div>
 <a
 href={r.url}
 target="_blank"
 rel="noopener noreferrer"
 className="block text-sm font-semibold text-gray-800 hover:text-fellowship-navy"
 >
 {r.title}
 </a>
 <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
 {r.description}
 </p>
 </div>
 }
 status={<ResourceTypeBadge type={r.type} />}
 meta={
 <div className="flex flex-wrap items-center gap-2">
 {r.moduleTitle ? (
 <span className="text-xs text-gray-700">
 <span className="font-semibold text-fellowship-navy">
 W{String(r.weekNumber).padStart(2, "0")}
 </span>{" "}
 · {r.moduleTitle}
 </span>
 ) : (
 <span className="text-xs italic text-gray-400">General</span>
 )}
 {r.tags.slice(0, 3).map((t) => (
 <Badge key={t} color="light">
 {t}
 </Badge>
 ))}
 {r.tags.length > 3 && (
 <span className="text-xs text-gray-500">
 +{r.tags.length - 3}
 </span>
 )}
 </div>
 }
 stats={[
 { label: "Bookmarks", value: r.bookmarkCount },
 {
 label: "Created by",
 value: (
 <div className="flex items-center gap-2">
 <AvatarText
 name={r.createdByName}
 className="h-6 w-6 text-[10px]"
 />
 <span className="truncate">{r.createdByName}</span>
 </div>
 ),
 },
 ]}
 actions={
 <RowActions
   resource={r}
   onEdit={() => onEdit(r)}
   onDelete={() => onDelete(r)}
 />
 }
 />
 ))}
 </MobileRowList>
 {/*
   Fixed-layout table — every cell honours its column width and long
   text truncates instead of pushing the table wider than the
   viewport. Below `md` the MobileRowList above takes over, so the
   tightest desktop width we worry about is ~768px.

   The `Table` UI primitive applies `min-w-full`; we override with
   `w-full table-fixed` via className. `<colgroup>` then gives us
   per-column width control without needing per-cell width hacks.
 */}
 {/* Note: NO `overflow-hidden` here — the row-action dropdown
     opens downward from the kebab and would be clipped if the
     wrapper hid overflow. The `table-fixed` layout below already
     prevents horizontal overflow, so we don't need the clip. */}
 <div className="hidden rounded-2xl border border-gray-200 bg-white md:block">
 <Table className="w-full table-fixed">
 <colgroup>
   <col />
   <col className="w-[110px]" />
   <col className="w-[24%]" />
   <col />
   <col className="w-[100px]" />
   <col className="w-[20%]" />
   <col className="w-[56px]" />
 </colgroup>
 <TableHeader className="border-b border-gray-100">
 <TableRow>
 <Th>Resource</Th>
 <Th>Type</Th>
 <Th>Module</Th>
 <Th>Tags</Th>
 <Th>Bookmarks</Th>
 <Th>Created by</Th>
 <Th right>
 <span className="sr-only">Actions</span>
 </Th>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-gray-100">
 {resources.map((r) => (
 <TableRow
 key={r.id}
 className="hover:bg-gray-50">
 <Td>
 {/* Min-w-0 lets the inner truncate hit; without it, the cell
     forces its column wider than the colgroup width on long titles. */}
 <div className="min-w-0">
 <a
 href={r.url}
 target="_blank" rel="noopener noreferrer" className="block truncate text-sm font-semibold text-gray-800 hover:text-fellowship-navy">
 {r.title}
 </a>
 <p className="mt-0.5 truncate text-xs text-gray-500">
 {r.description}
 </p>
 </div>
 </Td>
 <Td>
 <ResourceTypeBadge type={r.type} />
 </Td>
 <Td>
 {r.moduleTitle ? (
 <span className="block truncate text-sm text-gray-700">
 <span className="font-semibold text-fellowship-navy">
 W{String(r.weekNumber).padStart(2,"0")}
 </span>{" "}
 · {r.moduleTitle}
 </span>
 ) : (
 <span className="text-sm italic text-gray-400">General</span>
 )}
 </Td>
 <Td>
 <div className="flex flex-wrap gap-1">
 {r.tags.slice(0, 3).map((t) => (
 <Badge key={t} color="light">
 {t}
 </Badge>
 ))}
 {r.tags.length > 3 && (
 <span className="text-xs text-gray-500">
 +{r.tags.length - 3}
 </span>
 )}
 </div>
 </Td>
 <Td>
 <span className="text-sm tabular-nums text-gray-700">
 {r.bookmarkCount}
 </span>
 </Td>
 <Td>
 <div className="flex items-center gap-2 min-w-0">
 <AvatarText
 name={r.createdByName}
 className="h-7 w-7 shrink-0 text-xs"/>
 <span className="truncate text-sm text-gray-700">
 {r.createdByName}
 </span>
 </div>
 </Td>
 <Td right>
 <RowActions
   resource={r}
   onEdit={() => onEdit(r)}
   onDelete={() => onDelete(r)}
 />
 </Td>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 </>
 );
}

function ResourceTypeBadge({ type }: { type: ResourceType }) {
 const color =
 type ==="pdf"?"error": type ==="video"?"warning": type ==="tool"?"info": type ==="dataset"?"success":"light";
 return <Badge color={color}>{RESOURCE_TYPE_LABELS[type]}</Badge>;
}

function RowActions({
 resource,
 onEdit,
 onDelete,
}: {
 resource: Resource;
 onEdit: () => void;
 onDelete: () => void;
}) {
 const [open, setOpen] = useState(false);
 return (
 <div className="relative inline-block text-left">
 <button
 type="button" aria-label={`Actions for ${resource.title}`}
 aria-haspopup="menu" aria-expanded={open}
 onClick={() => setOpen((v) => !v)}
 className="dropdown-toggle inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800">
 <MoreDotIcon className="h-5 w-5"/>
 </button>
 <Dropdown
 isOpen={open}
 onClose={() => setOpen(false)}
 portal
 className="w-44 p-1">
 <ul role="menu" className="flex flex-col gap-0.5">
 <li role="none">
 <DropdownItem
 tag="a" href={resource.url}
 // External link, so we set target/rel directly here even
 // though `DropdownItem` doesn't expose them as props yet.
 onItemClick={() => setOpen(false)}
 baseClassName="block w-full rounded-md text-left px-3 py-2 text-sm font-medium transition-colors" className="text-gray-700 hover:bg-gray-100 hover:text-gray-900">
 Open in new tab
 </DropdownItem>
 </li>
 <Item
 onClick={() => {
   setOpen(false);
   onEdit();
 }}
 >
 Edit
 </Item>
 <Item
 destructive
 onClick={() => {
   setOpen(false);
   onDelete();
 }}
 >
 Delete
 </Item>
 </ul>
 </Dropdown>
 </div>
 );
}

function Item({
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

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
 return (
 <TableCell
 isHeader
 className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 sm:px-6 ${
 right ?"text-right":"text-left"}`}
 >
 {children}
 </TableCell>
 );
}

function Td({ children, right }: { children: React.ReactNode; right?: boolean }) {
 return (
 <TableCell
 className={`px-5 py-4 sm:px-6 ${right ?"text-right":"text-left"}`}
 >
 {children}
 </TableCell>
 );
}
