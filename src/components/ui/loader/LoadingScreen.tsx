import React from "react";
import Spinner from "./Spinner";

/**
 * Full-viewport-friendly loader. Used by route-segment `loading.tsx`
 * files and by any client component that wants to occupy a meaningful
 * area while data fetches.
 *
 * Two visual modes:
 *   - **inline** (default): centres in its parent, leaves the layout
 *     chrome (sidebar, top-nav) intact. Right for route-segment loaders
 *     since the layout shell renders around it instantly.
 *   - **fullScreen**: covers the viewport. Right for the very first
 *     paint (e.g. before the layout has decided which role's chrome to
 *     mount) — rare in this app since we render shell-first.
 */
export interface LoadingScreenProps {
  label?: string;
  /** Pick the framing. Defaults to inline. */
  variant?: "inline" | "fullScreen";
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  label = "Loading…",
  variant = "inline",
}) => {
  const containerClass =
    variant === "fullScreen"
      ? "flex min-h-screen items-center justify-center bg-white"
      : "flex min-h-[40vh] items-center justify-center";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" label={label} />
        <p
          aria-hidden
          className="text-sm font-medium text-gray-500"
        >
          {label}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
