"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { MoreDotIcon } from "@/icons";
import { deleteCourse, updateCourse, type CourseDetail } from "@/lib/api/courses";

export default function CourseDetailHeader({
 course,
 publishedCount,
}: {
 course: CourseDetail;
 publishedCount: number;
}) {
 const router = useRouter();
 const [menuOpen, setMenuOpen] = useState(false);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const { confirm, dialog: confirmDialog } = useConfirm();

 const togglePublish = async () => {
 setBusy(true);
 setError(null);
 try {
 await updateCourse(course.id, { isPublished: !course.isPublished });
 router.refresh();
 } catch (err) {
 setError(err instanceof Error ? err.message : "Couldn't update the course.");
 }
 setBusy(false);
 };

 const handleDelete = async () => {
 setMenuOpen(false);
 const ok = await confirm({
 title: `Delete "${course.title}"?`,
 message: "This can't be undone. The course and all its modules will be removed.",
 confirmLabel: "Delete course",
 tone: "danger",
 });
 if (!ok) return;
 setBusy(true);
 setError(null);
 try {
 await deleteCourse(course.id);
 router.push("/courses");
 router.refresh();
 } catch (err) {
 setError(err instanceof Error ? err.message : "Couldn't delete the course.");
 setBusy(false);
 }
 };

 return (
 <div className="flex flex-col gap-4">
 <Breadcrumbs
 items={[
 { label: "Dashboard", href: "/dashboard" },
 { label: "Courses", href: "/courses" },
 { label: course.title },
 ]}
 />

 <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 sm:flex-row sm:items-start sm:justify-between">
 <div className="min-w-0 flex-1">
 <div className="mb-2 flex items-center gap-2">
 {course.isPublished ? (
 <Badge color="success">Published</Badge>
 ) : (
 <Badge color="light">Draft</Badge>
 )}
 <span className="text-xs text-gray-500">
 Course
 </span>
 </div>
 <h1 className="text-title-sm font-bold text-gray-800 sm:text-title-md">
 {course.title}
 </h1>
 <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
 {course.description}
 </p>

 <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
 <span className="inline-flex items-center gap-2">
 <AvatarText name={course.ownerName} className="h-6 w-6 text-xs"/>
 Owned by {course.ownerName}
 </span>
 <span className="tabular-nums">
 {publishedCount} of {course.modules.length} modules published
 </span>
 </div>
 </div>

 <div className="flex shrink-0 flex-col items-end gap-2">
 <div className="flex items-center gap-2">
 <Button
 variant={course.isPublished ? "outline" : "fellowship"}
 size="sm"
 onClick={togglePublish}
 disabled={busy}
 >
 {busy
 ? (course.isPublished ? "Unpublishing…" : "Publishing…")
 : (course.isPublished ? "Unpublish course" : "Publish course")}
 </Button>
 <div className="relative">
 <button
 type="button" aria-label="Course actions" aria-haspopup="menu" aria-expanded={menuOpen}
 onClick={() => setMenuOpen((v) => !v)}
 className="dropdown-toggle inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50">
 <MoreDotIcon className="h-5 w-5"/>
 </button>
 <Dropdown
 isOpen={menuOpen}
 onClose={() => setMenuOpen(false)}
 className="w-48 p-1">
 <ul role="menu" className="flex flex-col gap-0.5">
 <Item destructive onClick={handleDelete}>
 Delete course
 </Item>
 </ul>
 </Dropdown>
 </div>
 </div>
 {error && (
 <span className="text-xs font-medium text-error-600">{error}</span>
 )}
 </div>
 </div>
 {confirmDialog}
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
