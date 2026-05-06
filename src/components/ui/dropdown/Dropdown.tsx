"use client";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  /**
   * When true, render via a portal into `document.body` with `position:
   * fixed` coordinates derived from the trigger button. Use this when the
   * dropdown lives inside a container with `overflow-x-auto` /
   * `overflow-hidden` (tables, cards, etc.) — those parents would
   * otherwise clip or constrain the menu.
   *
   * The trigger element is found by matching `.dropdown-toggle` inside
   * the parent of the wrapper that mounts the menu — which is the
   * convention this UI follows everywhere.
   */
  portal?: boolean;
  /** Where the menu aligns relative to the trigger when in portal mode. */
  align?: "end" | "start";
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  portal = false,
  align = "end",
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  // For portal mode: anchor coordinates derived from the trigger's
  // bounding rect. Recomputed on open + on scroll/resize.
  const [coords, setCoords] = useState<{ top: number; right: number; left: number } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".dropdown-toggle")
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Recompute portal coordinates on open + on scroll/resize so the menu
  // tracks the trigger when the page moves under it.
  useEffect(() => {
    if (!portal || !isOpen) return;
    const recomputeCoords = () => {
      // Find the most recently-clicked dropdown-toggle. We rely on the
      // `[aria-expanded="true"]` invariant the consumer pages set.
      const trigger = document.querySelector<HTMLElement>(
        '.dropdown-toggle[aria-expanded="true"]',
      );
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8, // 8px gap (matches the legacy `mt-2`)
        right: window.innerWidth - rect.right,
        left: rect.left,
      });
    };
    recomputeCoords();
    window.addEventListener("scroll", recomputeCoords, true);
    window.addEventListener("resize", recomputeCoords);
    return () => {
      window.removeEventListener("scroll", recomputeCoords, true);
      window.removeEventListener("resize", recomputeCoords);
    };
  }, [portal, isOpen]);

  if (!isOpen) return null;

  if (portal) {
    if (typeof window === "undefined" || !coords) return null;
    return createPortal(
      <div
        ref={dropdownRef}
        style={
          align === "end"
            ? { position: "fixed", top: coords.top, right: coords.right }
            : { position: "fixed", top: coords.top, left: coords.left }
        }
        className={`z-1000 rounded-xl border border-gray-200 bg-white shadow-theme-lg ${className}`}
      >
        {children}
      </div>,
      document.body,
    );
  }

  return (
    <div
      ref={dropdownRef}
      className={`absolute z-40 right-0 mt-2 rounded-xl border border-gray-200 bg-white shadow-theme-lg ${className}`}
    >
      {children}
    </div>
  );
};
