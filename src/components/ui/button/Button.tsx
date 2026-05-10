import React, { type ButtonHTMLAttributes, type ReactNode } from "react";

/**
 * Native `<button>` props are forwarded so callers can pass things like
 * `data-tour`, `aria-*`, `form`, `name`, etc. without the component
 * needing to know about each one. We intersect with our own visual props
 * rather than duplicating native attribute types.
 */
type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "size"
>;

export interface ButtonProps extends NativeButtonProps {
  children: ReactNode;
  size?: "sm" | "md";
  variant?: "primary" | "outline" | "fellowship";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

const SIZE_CLASSES = {
  sm: "px-4 py-3 text-sm",
  md: "px-5 py-3.5 text-sm",
} as const;

const VARIANT_CLASSES = {
  primary:
    "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
  outline:
    "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50",
  fellowship:
    "bg-pic-yellow text-fellowship-navy shadow-theme-xs hover:bg-pic-yellow-hover disabled:bg-pic-yellow-disabled disabled:text-fellowship-navy/60",
} as const;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    size = "md",
    variant = "primary",
    startIcon,
    endIcon,
    type = "button",
    className = "",
    disabled = false,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      } ${className}`}
      {...rest}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
});

export default Button;
