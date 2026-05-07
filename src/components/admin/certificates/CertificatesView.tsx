"use client";
import React, { useMemo, useState } from "react";
import {
 Table,
 TableBody,
 TableCell,
 TableHeader,
 TableRow,
} from "@/components/ui/table";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { MoreDotIcon, PencilIcon, PlusIcon } from "@/icons";
import { cn } from "@/lib/utils";
import type {
 CertificateTemplate,
 IssuedCertificate,
} from "@/lib/api/certificates";
import CertificatePreview from "./CertificatePreview";
import EditTemplateModal from "./EditTemplateModal";

type CertificatesViewProps = {
 template: CertificateTemplate;
 issued: IssuedCertificate[];
};

export default function CertificatesView({
 template,
 issued,
}: CertificatesViewProps) {
 const [editOpen, setEditOpen] = useState(false);

 return (
 <>
 <div className="flex flex-col gap-6">
 <Header issuedCount={issued.length} />
 <TemplateSection
 template={template}
 onEdit={() => setEditOpen(true)}
 />
 <IssuedSection issued={issued} />
 </div>
 <EditTemplateModal
 isOpen={editOpen}
 onClose={() => setEditOpen(false)}
 template={template}
 />
 </>
 );
}

function Header({ issuedCount }: { issuedCount: number }) {
 return (
 <div>
 <h1 className="text-title-md font-bold text-gray-800">
 Certificates
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 Auto-generated from a template when fellows complete a course. {issuedCount} issued so far.
 </p>
 </div>
 );
}

function TemplateSection({
 template,
 onEdit,
}: {
 template: CertificateTemplate;
 onEdit: () => void;
}) {
 return (
 <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
 <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
 <div>
 <h2 className="text-base font-semibold text-gray-800">
 Template
 </h2>
 <p className="mt-1 text-sm text-gray-500">
 Preview with sample data. Every issued certificate is rendered from this template.
 </p>
 </div>
 <Button
 variant="outline" size="sm" startIcon={<PencilIcon />}
 onClick={onEdit}
 >
 Edit template
 </Button>
 </div>
 <div className="mx-auto max-w-3xl">
 <CertificatePreview template={template} />
 </div>
 </section>
 );
}

function IssuedSection({ issued }: { issued: IssuedCertificate[] }) {
 const [showRevoked, setShowRevoked] = useState(true);
 const [search, setSearch] = useState("");

 const visible = useMemo(() => {
 const q = search.trim().toLowerCase();
 return issued.filter((c) => {
 if (!showRevoked && c.isRevoked) return false;
 if (q) {
 return (
 c.fellowName.toLowerCase().includes(q) ||
 c.certificateNumber.toLowerCase().includes(q) ||
 c.courseTitle.toLowerCase().includes(q)
 );
 }
 return true;
 });
 }, [issued, showRevoked, search]);

 return (
 <section className="rounded-2xl border border-gray-200 bg-white">
 <div className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
 <div>
 <h2 className="text-base font-semibold text-gray-800">
 Issued certificates
 </h2>
 <p className="mt-1 text-sm text-gray-500">
 Auto-generated when fellows complete a course. Manual issuance is for edge cases.
 </p>
 </div>
 <Button variant="fellowship" size="sm" startIcon={<PlusIcon />}>
 Issue manually
 </Button>
 </div>

 <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
 <input
 type="search" value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search by fellow, course, or number…" className="h-10 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-none focus:ring-3 focus:ring-fellowship-navy/10 sm:max-w-xs"/>
 <label className="inline-flex items-center gap-2 text-sm text-gray-600">
 <input
 type="checkbox" checked={showRevoked}
 onChange={(e) => setShowRevoked(e.target.checked)}
 className="h-4 w-4 rounded border-gray-300 text-fellowship-navy focus:ring-fellowship-navy"/>
 Show revoked
 </label>
 </div>

 <div className="max-w-full overflow-x-auto border-t border-gray-100">
 {visible.length === 0 ? (
 <div className="px-6 py-12 text-center text-sm text-gray-500">
 No certificates match.
 </div>
 ) : (
 <Table>
 <TableHeader className="border-b border-gray-100">
 <TableRow>
 <Th>Fellow</Th>
 <Th>Course</Th>
 <Th>Number</Th>
 <Th>Issued</Th>
 <Th>Status</Th>
 <Th right>
 <span className="sr-only">Actions</span>
 </Th>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-gray-100">
 {visible.map((c) => (
 <TableRow
 key={c.id}
 className={cn("hover:bg-gray-50",
 c.isRevoked &&"opacity-60")}
 >
 <Td>
 <div className="flex items-center gap-3">
 <AvatarText name={c.fellowName} className="h-9 w-9"/>
 <span className="text-sm font-semibold text-gray-800">
 {c.fellowName}
 </span>
 </div>
 </Td>
 <Td>
 <span className="text-sm text-gray-700">
 {c.courseTitle}
 </span>
 </Td>
 <Td>
 <span className="font-mono text-xs text-gray-600">
 {c.certificateNumber}
 </span>
 </Td>
 <Td>
 <span className="text-sm text-gray-500">
 {new Date(c.issuedAt).toLocaleDateString(undefined, {
 year:"numeric",
 month:"short",
 day:"numeric",
 })}
 </span>
 </Td>
 <Td>
 {c.isRevoked ? (
 <div className="flex flex-col gap-0.5">
 <Badge color="error">Revoked</Badge>
 {c.revokedReason && (
 <span className="text-xs text-gray-500">
 {c.revokedReason}
 </span>
 )}
 </div>
 ) : (
 <Badge color="success">Issued</Badge>
 )}
 </Td>
 <Td right>
 <RowActions cert={c} />
 </Td>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 )}
 </div>
 </section>
 );
}

function RowActions({ cert }: { cert: IssuedCertificate }) {
 const [open, setOpen] = useState(false);
 const [copied, setCopied] = useState(false);

 const copyVerifyLink = () => {
 if (typeof navigator !=="undefined"&& navigator.clipboard) {
 navigator.clipboard.writeText(cert.verifyUrl).then(() => {
 setCopied(true);
 setTimeout(() => setCopied(false), 1500);
 });
 }
 };

 return (
 <div className="relative inline-block text-left">
 <button
 type="button" aria-label={`Actions for ${cert.fellowName}'s certificate`}
 aria-haspopup="menu" aria-expanded={open}
 onClick={() => setOpen((v) => !v)}
 className="dropdown-toggle inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800">
 <MoreDotIcon className="h-5 w-5"/>
 </button>
 <Dropdown
 isOpen={open}
 onClose={() => setOpen(false)}
 portal
 className="w-48 p-1">
 <ul role="menu" className="flex flex-col gap-0.5">
 <Item onClick={() => setOpen(false)}>Download PDF</Item>
 <Item
 onClick={() => {
 copyVerifyLink();
 setOpen(false);
 }}
 >
 {copied ?"Copied!":"Copy verify link"}
 </Item>
 {!cert.isRevoked && <Item onClick={() => setOpen(false)}>Reissue</Item>}
 {cert.isRevoked ? (
 <Item onClick={() => setOpen(false)}>Restore</Item>
 ) : (
 <Item destructive onClick={() => setOpen(false)}>
 Revoke
 </Item>
 )}
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
