"use client";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  animate,
} from "motion/react";
import { useEffect } from "react";

type CountUpProps = {
  value: number;
  /** Render `${prefix}${rounded}${suffix}` — e.g. suffix="%" or "/12". */
  prefix?: string;
  suffix?: string;
  /** Animation duration in seconds. Defaults to 0.9. */
  duration?: number;
  /** Decimal places. Defaults to 0. */
  decimals?: number;
};

/**
 * Animates a number from 0 to `value` on mount. Respects
 * `prefers-reduced-motion` — in that case it renders the final value
 * immediately with no animation.
 */
export default function CountUp({
  value,
  prefix = "",
  suffix = "",
  duration = 0.9,
  decimals = 0,
}: CountUpProps) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const display = useTransform(mv, (latest) =>
    `${prefix}${latest.toFixed(decimals)}${suffix}`,
  );

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [value, duration, reduce, mv]);

  return <motion.span>{display}</motion.span>;
}
