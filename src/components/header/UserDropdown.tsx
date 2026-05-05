"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import AvatarText from "../ui/avatar/AvatarText";
import { ChevronDownIcon, UserCircleIcon } from "@/icons";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";

export default function UserDropdown() {
 const user = useCurrentUser();
 const router = useRouter();
 const [isOpen, setIsOpen] = useState(false);
 const firstName = user.fullName.split(" ")[0];
 // Fellow's profile lives under the fellow route group at /my-profile;
 // every other role uses the shared /profile under (admin).
 const profileHref = user.role === "fellow" ? "/my-profile" : "/profile";

 function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
 e.stopPropagation();
 setIsOpen((prev) => !prev);
 }

 function closeDropdown() {
 setIsOpen(false);
 }

 async function handleSignOut() {
 closeDropdown();
 // Best-effort: tell the backend to clear the session cookie. We don't
 // surface errors — the user wants out either way, and the redirect
 // below will land them on /signin regardless.
 try {
 await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
 } catch {
 // backend offline — continue with local sign-out
 }
 router.push("/signin");
 router.refresh();
 }

 return (
 <div className="relative">
 <button
 onClick={toggleDropdown}
 className="dropdown-toggle flex items-center gap-2 text-gray-700 hover:text-gray-900" aria-haspopup="menu" aria-expanded={isOpen}
 >
 <AvatarText name={user.fullName} className="h-10 w-10"/>
 <span className="hidden font-medium text-theme-sm sm:block">
 {firstName}
 </span>
 <ChevronDownIcon
 className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
 isOpen ?"rotate-180":""}`}
 />
 </button>

 <Dropdown
 isOpen={isOpen}
 onClose={closeDropdown}
 className="absolute right-0 mt-3 flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg">
 <div className="px-2 pt-1">
 <span className="block font-medium text-gray-800 text-theme-sm">
 {user.fullName}
 </span>
 <span className="mt-0.5 block text-theme-xs text-gray-500">
 {user.email}
 </span>
 </div>

 <ul className="mt-3 flex flex-col gap-0.5 border-t border-gray-100 pt-2">
 <li>
 <DropdownItem
 onItemClick={closeDropdown}
 tag="a" href={profileHref} baseClassName="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-theme-sm font-medium transition-colors" className="text-gray-700 hover:bg-gray-100 hover:text-gray-900">
 <UserCircleIcon className="h-5 w-5 text-gray-500"/>
 Edit profile
 </DropdownItem>
 </li>
 </ul>

 <div className="mt-2 border-t border-gray-100 pt-2">
 <button
 type="button" onClick={handleSignOut}
 className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-theme-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900">
 <SignOutIcon />
 Sign out
 </button>
 </div>
 </Dropdown>
 </div>
 );
}

function SignOutIcon() {
 return (
 <svg
 className="h-5 w-5 text-gray-500" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden
 >
 <path
 fillRule="evenodd" clipRule="evenodd" d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z" fill="currentColor"/>
 </svg>
 );
}
