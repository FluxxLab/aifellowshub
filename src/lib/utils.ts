import { twMerge } from "tailwind-merge";

type ClassDictionary = Record<string, unknown>;
type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassDictionary
  | ClassValue[];

function toClassName(value: ClassValue): string {
  if (Array.isArray(value)) return value.map(toClassName).filter(Boolean).join(" ");
  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k)
      .join(" ");
  }
  return value ? String(value) : "";
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(inputs.map(toClassName).filter(Boolean).join(" "));
}
