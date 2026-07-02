"use client";
import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const [coords, setCoords] = useState<{
    triggerTop: number;
    triggerBottom: number;
    right: number;
    left: number;
  } | null>(null);
  // Whether the menu opens below the trigger (default) or flips above it when
  // there isn't enough room below — otherwise the last rows of a table run the
  // menu off the bottom of the viewport (users had to zoom out to reach it).
  const [placement, setPlacement] = useState<"down" | "up">("down");

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
        triggerTop: rect.top,
        triggerBottom: rect.bottom,
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

  // After the menu is in the DOM, measure it and flip above the trigger when
  // it wouldn't fit below and there's more room above. Runs before paint to
  // avoid a visible jump.
  useLayoutEffect(() => {
    if (!portal || !isOpen || !coords) return;
    const el = dropdownRef.current;
    if (!el) return;
    const gap = 8;
    // scrollHeight, not offsetHeight — the maxHeight cap we apply below would
    // otherwise shrink offsetHeight and hide the true content height, so the
    // flip decision would never trigger.
    const menuHeight = el.scrollHeight;
    const spaceBelow = window.innerHeight - coords.triggerBottom;
    const spaceAbove = coords.triggerTop;
    const next =
      spaceBelow < menuHeight + gap && spaceAbove > spaceBelow ? "up" : "down";
    setPlacement((prev) => (prev === next ? prev : next));
  }, [portal, isOpen, coords, children]);

  if (!isOpen) return null;

  if (portal) {
    if (typeof window === "undefined" || !coords) return null;
    const gap = 8;
    // Cap the menu to the space on its chosen side so a very tall menu (or a
    // short viewport) scrolls internally instead of spilling off-screen.
    const maxHeight =
      placement === "up"
        ? coords.triggerTop - gap - 8
        : window.innerHeight - coords.triggerBottom - gap - 8;
    const vStyle =
      placement === "up"
        ? { bottom: window.innerHeight - coords.triggerTop + gap }
        : { top: coords.triggerBottom + gap };
    const hStyle =
      align === "end" ? { right: coords.right } : { left: coords.left };
    return createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: "fixed",
          ...vStyle,
          ...hStyle,
          maxHeight,
          overflowY: "auto",
        }}
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
