"use client";
import React, { useState } from "react";
import Link from "next/link";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { ChevronLeftIcon, MoreDotIcon, PencilIcon } from "@/icons";
import type { FellowProfile, FellowStatus } from "@/lib/api/participants";

type ProfileHeaderProps = {
 fellow: FellowProfile;
};

export default function ProfileHeader({ fellow }: ProfileHeaderProps) {
 const [menuOpen, setMenuOpen] = useState(false);

 return (
 <div className="flex flex-col gap-4">
 <Link
 href="/participants" className="inline-flex w-fit items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700">
 <ChevronLeftIcon className="h-4 w-4"/>
 Back to participants
 </Link>

 <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 sm:flex-row sm:items-start sm:justify-between">
 <div className="flex items-start gap-4">
 <AvatarText name={fellow.fullName} className="h-16 w-16 text-base"/>
 <div>
 <h1 className="text-title-sm font-bold text-gray-800">
 {fellow.fullName}
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 {fellow.jobTitle} · {fellow.organisation} · {fellow.country}
 </p>
 <div className="mt-3 flex flex-wrap items-center gap-2">
 <Badge color="info">Fellow</Badge>
 <FellowStatusBadge status={fellow.status} />
 <Badge color="light">{fellow.sector}</Badge>
 </div>
 </div>
 </div>

 <div className="flex shrink-0 items-center gap-2">
 <Button variant="outline" size="sm" startIcon={<PencilIcon />}>
 Edit
 </Button>
 <div className="relative">
 <button
 type="button" aria-label="More actions" aria-haspopup="menu" aria-expanded={menuOpen}
 onClick={() => setMenuOpen((v) => !v)}
 className="dropdown-toggle inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50">
 <MoreDotIcon className="h-5 w-5"/>
 </button>
 <Dropdown
 isOpen={menuOpen}
 onClose={() => setMenuOpen(false)}
 className="w-48 p-1">
 <ul role="menu" className="flex flex-col gap-0.5">
 <li role="none">
 <DropdownItem
 onItemClick={() => setMenuOpen(false)}
 baseClassName="block w-full rounded-md text-left px-3 py-2 text-sm font-medium transition-colors" className="text-gray-700 hover:bg-gray-100 hover:text-gray-900">
 Reassign mentor
 </DropdownItem>
 </li>
 <li role="none">
 <DropdownItem
 onItemClick={() => setMenuOpen(false)}
 baseClassName="block w-full rounded-md text-left px-3 py-2 text-sm font-medium transition-colors" className="text-gray-700 hover:bg-gray-100 hover:text-gray-900">
 Deactivate
 </DropdownItem>
 </li>
 <li role="none">
 <DropdownItem
 onItemClick={() => setMenuOpen(false)}
 baseClassName="block w-full rounded-md text-left px-3 py-2 text-sm font-medium transition-colors" className="text-error-600 hover:bg-error-50">
 Delete
 </DropdownItem>
 </li>
 </ul>
 </Dropdown>
 </div>
 </div>
 </div>
 </div>
 );
}

function FellowStatusBadge({ status }: { status: FellowStatus }) {
 if (status ==="active") return <Badge color="success">Active</Badge>;
 if (status ==="at-risk") return <Badge color="error">At-risk</Badge>;
 return <Badge color="light">Inactive</Badge>;
}
