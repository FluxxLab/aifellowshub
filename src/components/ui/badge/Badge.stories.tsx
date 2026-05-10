import type { Meta, StoryObj } from "@storybook/react";
import Badge from "./Badge";

/**
 * Badge surfaces small status pills throughout the app — capstone
 * status, attendance state, role labels, etc.
 *
 * Two variants (`light` is the default soft-tinted pill, `solid` is
 * the high-contrast version), seven semantic colours, two sizes.
 * Keep colour usage *semantic*: `success` for completed, `warning`
 * for in-progress / due soon, `error` for blocked / failed, `info`
 * for neutral signal, `light` / `dark` for non-semantic groupings.
 */
const meta: Meta<typeof Badge> = {
  title: "Primitives/Badge",
  component: Badge,
  args: {
    children: "Approved",
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["light", "solid"] },
    color: {
      control: "select",
      options: [
        "primary",
        "success",
        "error",
        "warning",
        "info",
        "light",
        "dark",
      ],
    },
    size: { control: "inline-radio", options: ["sm", "md"] },
  },
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { color: "primary" },
};

export const StatusSet: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <Badge {...args} color="success">
        Completed
      </Badge>
      <Badge {...args} color="warning">
        In progress
      </Badge>
      <Badge {...args} color="error">
        Blocked
      </Badge>
      <Badge {...args} color="info">
        Under review
      </Badge>
      <Badge {...args} color="light">
        Locked
      </Badge>
    </div>
  ),
  args: { variant: "light" },
};

export const Solid: Story = {
  args: { variant: "solid", color: "success", children: "Distinction" },
};

export const Small: Story = {
  args: { size: "sm", color: "warning", children: "Draft" },
};
