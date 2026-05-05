import React from "react";
import { cn } from "@/lib/utils";

interface AvatarTextProps {
 name: string;
 className?: string;
}

const COLOR_CLASSES = ["bg-brand-100 text-brand-700","bg-success-100 text-success-700","bg-warning-100 text-warning-700","bg-error-100 text-error-700","bg-blue-light-100 text-blue-light-700","bg-orange-100 text-orange-700",
];

function getInitials(name: string): string {
 const parts = name.trim().split(/\s+/).filter(Boolean);
 if (parts.length === 0) return "?";
 if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
 return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorClass(name: string): string {
 // Deterministic palette assignment so the same name always gets the same colour.
 const index = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
 return COLOR_CLASSES[index % COLOR_CLASSES.length];
}

const AvatarText: React.FC<AvatarTextProps> = ({ name, className }) => {
 return (
 <div
 className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold",
 getColorClass(name),
 className
 )}
 aria-label={name}
 >
 <span className="text-sm">{getInitials(name)}</span>
 </div>
 );
};

export default AvatarText;
