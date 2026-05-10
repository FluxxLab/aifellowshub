import React, { type HTMLAttributes } from "react";

/**
 * Single shimmer placeholder block.
 *
 * Use `Skeleton` when the layout is predictable (we know roughly what's
 * coming back) and `Spinner` when it isn't. Per-page skeleton wrappers
 * (see `PageSkeleton`) compose this primitive into the typical role-
 * page shape so route-segment `loading.tsx` files can render a layout
 * that mirrors the eventual content — no centred-spinner-then-content
 * layout shift, faster perceived load.
 *
 * Sizing: the primitive intentionally has no default dimensions. Pass
 * Tailwind utilities (`h-4 w-32`, `h-32 w-full`, etc.) so each call
 * site can match its target. A circle variant is offered for avatar
 * placeholders since `rounded-full` + equal width/height is a common
 * shape worth a one-prop helper.
 *
 * Accessibility: individual skeletons are decorative and rendered with
 * `aria-hidden`. Wrappers (PageSkeleton or any caller spinning up a
 * field of skeletons) should announce themselves with `role="status"`
 * + an `sr-only` "Loading…" so screen readers get one announcement
 * per loading region, not one per shimmer block.
 */
type Shape = "rect" | "circle";

type NativeDivProps = HTMLAttributes<HTMLDivElement>;

export interface SkeletonProps extends NativeDivProps {
  /** `rect` is rounded-md, `circle` is fully round (use h-N w-N together). */
  shape?: Shape;
}

const SHAPE_CLASSES: Record<Shape, string> = {
  rect: "rounded-md",
  circle: "rounded-full",
};

const Skeleton: React.FC<SkeletonProps> = ({
  shape = "rect",
  className = "",
  ...rest
}) => {
  return (
    <div
      aria-hidden
      className={`animate-pulse bg-gray-200/80 ${SHAPE_CLASSES[shape]} ${className}`}
      {...rest}
    />
  );
};

export default Skeleton;
