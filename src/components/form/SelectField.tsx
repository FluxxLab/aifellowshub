"use client";
import React, { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/icons";
import { cn } from "@/lib/utils";

export type SelectOption<V extends string = string> = {
  value: V;
  label: string;
  disabled?: boolean;
};

type SelectFieldProps<V extends string = string> = {
  /** Controlled value. Pair with `onChange`. */
  value?: V | "";
  defaultValue?: V | "";
  onChange: (value: V) => void;
  options: SelectOption<V>[];
  placeholder?: string;
  disabled?: boolean;
  /** Show the trigger in error styling. */
  error?: boolean;
  /** "md" matches Input height (h-11). "sm" is compact for inline use. */
  size?: "sm" | "md";
  className?: string;
  id?: string;
  name?: string;
  ariaLabel?: string;
};

/**
 * Drop-in replacement for `<select>` that renders the trigger as a styled
 * button and the option list as a custom popover — keeps look + feel of the
 * design system on every browser. Same prop shape as the form-element Input
 * field so it composes the same way.
 */
export default function SelectField<V extends string = string>({
  value,
  defaultValue,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  error = false,
  size = "md",
  className,
  id,
  name,
  ariaLabel,
}: SelectFieldProps<V>) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<V | "">(
    (defaultValue ?? "") as V | "",
  );
  const current = (isControlled ? value : internal) ?? "";
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Sync highlight to selected value when opening
  useEffect(() => {
    if (open) {
      const idx = options.findIndex((o) => o.value === current);
      setHighlight(idx >= 0 ? idx : 0);
    }
  }, [open, current, options]);

  const select = (v: V) => {
    if (!isControlled) setInternal(v);
    onChange(v);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (
      !open &&
      (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")
    ) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (open) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, options.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const opt = options[highlight];
        if (opt && !opt.disabled) select(opt.value);
      }
    }
  };

  const selected = options.find((o) => o.value === current);

  return (
    <div
      ref={containerRef}
      className={cn("relative", disabled && "pointer-events-none opacity-60", className)}
    >
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-lg border bg-transparent shadow-theme-xs transition-colors",
          "focus:outline-hidden focus:ring-3",
          size === "md"
            ? "h-11 px-4 py-2.5 text-sm"
            : "h-8 px-2.5 py-1 text-xs",
          error
            ? "border-error-300 text-error-800 focus:border-error-500 focus:ring-error-500/10"
            : "border-gray-300 text-gray-800 focus:border-fellowship-navy focus:ring-fellowship-navy/10 hover:border-gray-400",
        )}
      >
        <span
          className={cn(
            "truncate text-left",
            !selected && "text-gray-400",
          )}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon
          className={cn(
            "h-4 w-4 shrink-0 text-gray-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Hidden native input keeps form submissions and labels working. */}
      {name && <input type="hidden" name={name} value={current} />}

      {open && (
        <ul
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-theme-lg"
        >
          {options.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">
              No options available
            </li>
          )}
          {options.map((opt, i) => {
            const isSelected = opt.value === current;
            const isHighlighted = i === highlight;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled}
              >
                <button
                  type="button"
                  disabled={opt.disabled}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => !opt.disabled && select(opt.value)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                    opt.disabled && "cursor-not-allowed text-gray-400",
                    !opt.disabled && isHighlighted && "bg-fellowship-navy/5 text-fellowship-navy",
                    !opt.disabled && !isHighlighted && "text-gray-700 hover:bg-gray-100",
                    isSelected && !opt.disabled && "font-semibold text-fellowship-navy",
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && !opt.disabled && (
                    <span aria-hidden className="ml-2 text-fellowship-navy">
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
