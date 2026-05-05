import React from "react";

type AdminPagePlaceholderProps = {
 title: string;
 description: string;
 brdRef?: string;
};

export default function AdminPagePlaceholder({
 title,
 description,
 brdRef,
}: AdminPagePlaceholderProps) {
 return (
 <div className="mx-auto max-w-3xl py-12">
 <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
 <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-warning-100">
 <span aria-hidden className="text-xl">
 ⚙
 </span>
 </div>
 <h1 className="mb-2 text-title-sm font-bold text-gray-800">
 {title}
 </h1>
 <p className="mx-auto mb-4 max-w-md text-sm leading-relaxed text-gray-500">
 {description}
 </p>
 {brdRef && (
 <p className="text-xs text-gray-400">
 Spec: {brdRef}
 </p>
 )}
 </div>
 </div>
 );
}
