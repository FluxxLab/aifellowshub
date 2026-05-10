import type { Meta, StoryObj } from "@storybook/react";
import Button from "../button/Button";
import Spinner from "./Spinner";

/**
 * Spinner is the design-system replacement for the half-dozen ad-hoc
 * inline spinners that used to live across the LMS. Three sizes:
 *  - `sm` for inline (button labels, table cells)
 *  - `md` for medium contexts (modal bodies waiting on data)
 *  - `lg` for full-page loaders (paired with `LoadingScreen`)
 *
 * Always announces itself to screen readers via `role="status"` +
 * `aria-live="polite"` plus a visible-to-AT-only `sr-only` label.
 * Override the label when context isn't already announced.
 */
const meta: Meta<typeof Spinner> = {
  title: "Primitives/Spinner",
  component: Spinner,
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
    label: { control: "text" },
  },
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: { size: "md" },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <div className="flex flex-col items-center gap-1">
        <Spinner size="sm" />
        <span className="text-xs text-gray-500">sm</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Spinner size="md" />
        <span className="text-xs text-gray-500">md</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Spinner size="lg" />
        <span className="text-xs text-gray-500">lg</span>
      </div>
    </div>
  ),
};

export const InsideButton: Story = {
  // The original use case that prompted the primitive — a CTA showing
  // its work without changing label width or losing focus.
  render: () => (
    <Button variant="fellowship" disabled startIcon={<Spinner size="sm" />}>
      Saving draft
    </Button>
  ),
};

export const CustomLabel: Story = {
  args: { size: "md", label: "Loading mentors…" },
};
