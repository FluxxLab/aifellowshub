import React, { type HTMLAttributes } from "react";

type BadgeVariant = "light" | "solid";
type BadgeSize = "sm" | "md";
type BadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";

/**
 * Native span attributes are forwarded so callers can drop
 * `data-tour`, `aria-*`, `title`, etc. on the badge directly.
 */
type NativeSpanProps = Omit<HTMLAttributes<HTMLSpanElement>, "color">;

export interface BadgeProps extends NativeSpanProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: BadgeColor;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children: React.ReactNode;
}

const SIZE_STYLES = {
  sm: "text-theme-xs",
  md: "text-sm",
} as const;

const VARIANT_STYLES = {
  light: {
    primary: "bg-brand-50 text-brand-500",
    success: "bg-success-50 text-success-600",
    error: "bg-error-50 text-error-600",
    warning: "bg-warning-50 text-warning-600",
    info: "bg-blue-light-50 text-blue-light-500",
    light: "bg-gray-100 text-gray-700",
    dark: "bg-gray-500 text-white",
  },
  solid: {
    primary: "bg-brand-500 text-white",
    success: "bg-success-500 text-white",
    error: "bg-error-500 text-white",
    warning: "bg-warning-500 text-white",
    info: "bg-blue-light-500 text-white",
    light: "bg-gray-400 text-white",
    dark: "bg-gray-700 text-white",
  },
} as const;

const Badge: React.FC<BadgeProps> = ({
  variant = "light",
  color = "primary",
  size = "md",
  startIcon,
  endIcon,
  children,
  className = "",
  ...rest
}) => {
  const base =
    "inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 font-medium";
  return (
    <span
      className={`${base} ${SIZE_STYLES[size]} ${VARIANT_STYLES[variant][color]} ${className}`}
      {...rest}
    >
      {startIcon && <span className="mr-1">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-1">{endIcon}</span>}
    </span>
  );
};

export default Badge;
