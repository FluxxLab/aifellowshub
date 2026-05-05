"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type PageTransitionProps = {
  children: ReactNode;
  /** Stagger child cards' entrance. Children must be `<MotionItem>` instances. */
  stagger?: boolean;
};

/**
 * Subtle fade-rise on mount for a route's main content. Respects
 * `prefers-reduced-motion` — disables the animation entirely in that
 * case so the page just renders.
 */
export default function PageTransition({
  children,
  stagger = false,
}: PageTransitionProps) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: stagger ? 0.06 : 0,
      }}
    >
      {children}
    </motion.div>
  );
}

/** Child of PageTransition that participates in the stagger. */
export function MotionItem({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
