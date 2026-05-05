import { twMerge } from "tailwind-merge";

type ClassValue = string | number | null | false | undefined | ClassValue[];

function toClassName(value: ClassValue): string {
  if (Array.isArray(value)) return value.map(toClassName).filter(Boolean).join(" ");
  return value ? String(value) : "";
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(inputs.map(toClassName).filter(Boolean).join(" "));
}
