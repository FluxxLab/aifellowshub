import type { Meta, StoryObj } from "@storybook/react";
import Skeleton from "./Skeleton";

/**
 * Single shimmer block. Pair with Tailwind sizing utilities (`h-4 w-32`,
 * `h-32 w-full`, etc.) — the primitive intentionally has no defaults
 * so call sites can match the eventual content's shape.
 *
 * For full pages, prefer `PageSkeleton`. Reach for raw `Skeleton` only
 * when composing a per-component placeholder (a card, a row, a chart).
 */
const meta: Meta<typeof Skeleton> = {
  title: "Primitives/Skeleton",
  component: Skeleton,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Text: Story = {
  args: { className: "h-4 w-48" },
};

export const Block: Story = {
  args: { className: "h-32 w-64" },
};

export const Avatar: Story = {
  args: { shape: "circle", className: "h-12 w-12" },
};

export const Stack: Story = {
  // What you'd render while a multi-line bio loads.
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <Skeleton className="h-5 w-3/5" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  ),
};

export const Card: Story = {
  // A typical content-card placeholder used inside `PageSkeleton`.
  render: () => (
    <div className="w-80 rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex items-center gap-3">
        <Skeleton shape="circle" className="h-9 w-9" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="mt-4 h-7 w-20" />
    </div>
  ),
};
