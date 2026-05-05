"use client";
import React, { createContext, useContext, useState } from "react";
import { ChevronDownIcon } from "@/icons";
import { cn } from "@/lib/utils";

type AccordionContextValue = {
 openValue: string | null;
 setOpenValue: (value: string | null) => void;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordion() {
 const ctx = useContext(AccordionContext);
 if (!ctx) throw new Error("Accordion subcomponents must be used inside <Accordion>");
 return ctx;
}

type AccordionItemContextValue = { value: string };
const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function useAccordionItem() {
 const ctx = useContext(AccordionItemContext);
 if (!ctx) throw new Error("AccordionTrigger/Content must be used inside <AccordionItem>");
 return ctx;
}

type AccordionProps = {
 children: React.ReactNode;
 className?: string;
 defaultValue?: string | null;
};

export function Accordion({ children, className, defaultValue = null }: AccordionProps) {
 const [openValue, setOpenValue] = useState<string | null>(defaultValue);
 return (
 <AccordionContext.Provider value={{ openValue, setOpenValue }}>
 <div className={cn("w-full", className)}>{children}</div>
 </AccordionContext.Provider>
 );
}

type AccordionItemProps = {
 value: string;
 children: React.ReactNode;
 className?: string;
};

export function AccordionItem({ value, children, className }: AccordionItemProps) {
 return (
 <AccordionItemContext.Provider value={{ value }}>
 <div className={cn("border-b border-gray-200", className)}>
 {children}
 </div>
 </AccordionItemContext.Provider>
 );
}

type AccordionTriggerProps = {
 children: React.ReactNode;
 className?: string;
};

export function AccordionTrigger({ children, className }: AccordionTriggerProps) {
 const { openValue, setOpenValue } = useAccordion();
 const { value } = useAccordionItem();
 const isOpen = openValue === value;

 return (
 <button
 type="button" onClick={() => setOpenValue(isOpen ? null : value)}
 aria-expanded={isOpen}
 className={cn("flex w-full items-center justify-between gap-4 py-5 text-left transition-colors","text-gray-800 hover:text-brand-500",
 className
 )}
 >
 <span className="flex-1">{children}</span>
 <ChevronDownIcon
 className={cn("h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200",
 isOpen &&"rotate-180 text-brand-500")}
 />
 </button>
 );
}

type AccordionContentProps = {
 children: React.ReactNode;
 className?: string;
};

export function AccordionContent({ children, className }: AccordionContentProps) {
 const { openValue } = useAccordion();
 const { value } = useAccordionItem();
 if (openValue !== value) return null;

 return <div className={cn("pb-5", className)}>{children}</div>;
}
