import type { Meta, StoryObj } from "@storybook/react";
import PageSkeleton from "./PageSkeleton";

/**
 * The page-level skeleton used by every role's `loading.tsx`. Three
 * variants cover ~95% of the LMS pages — anything more bespoke
 * (forum chat, capstone editor) gets a per-page `loading.tsx` next
 * to its `page.tsx`.
 */
const meta: Meta<typeof PageSkeleton> = {
  title: "Primitives/PageSkeleton",
  component: PageSkeleton,
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["dashboard", "list", "detail"],
    },
    label: { control: "text" },
  },
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof PageSkeleton>;

export const Dashboard: Story = {
  args: { variant: "dashboard" },
};

export const List: Story = {
  args: { variant: "list" },
};

export const Detail: Story = {
  args: { variant: "detail" },
};

export const ContextualLabel: Story = {
  args: { variant: "dashboard", label: "Loading capstone overview…" },
};
