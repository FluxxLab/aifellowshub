import React, { type HTMLAttributes } from "react";

/**
 * Small inline activity indicator. Use it inside buttons, table cells,
 * or anywhere a synchronous "this is working" cue is needed without
 * blocking the rest of the layout.
 *
 * Why a primitive instead of inline `<svg className="animate-spin">`:
 * the LMS had ~10 ad-hoc spinner instances (varying sizes, varying
 * colours, mixed a11y) before this. One component keeps the design
 * system honest, gives screen readers a real announcement, and lets
 * us swap the implementation later without grep-and-replace.
 */
type Size = "sm" | "md" | "lg";

type NativeSpanProps = HTMLAttributes<HTMLSpanElement>;

export interface SpinnerProps extends NativeSpanProps {
  size?: Size;
  /**
   * Visible-to-screen-readers label. Override when the surrounding
   * context isn't already labelled (e.g. a standalone full-page
   * loader needs "Loading dashboard…", an inline button spinner can
   * lean on the button's accessible name).
   */
  label?: string;
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
};

const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  label = "Loading…",
  className = "",
  ...rest
}) => {
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center justify-center ${className}`}
      {...rest}
    >
      <span
        aria-hidden
        className={`block animate-spin rounded-full border-fellowship-navy/15 border-t-fellowship-navy ${SIZE_CLASSES[size]}`}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
};

export default Spinner;
