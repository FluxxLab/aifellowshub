import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";
import Button from "./Button";

/**
 * Button is the primary call-to-action across the LMS.
 *
 * Three visual variants — primary (default brand), outline (secondary
 * actions), and fellowship (the warm yellow CTA used on most fellow-
 * facing screens). Two sizes — `sm` for inline / table actions, `md`
 * for hero CTAs.
 *
 * Native props (`onClick`, `disabled`, `data-*`, `aria-*`, `form`,
 * etc.) all forward to the underlying `<button>`, and `forwardRef`
 * lets parents grab the DOM node when they need to manage focus or
 * trigger imperative behaviour.
 */
const meta: Meta<typeof Button> = {
  title: "Primitives/Button",
  component: Button,
  args: {
    children: "Save changes",
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "outline", "fellowship"],
    },
    size: { control: "inline-radio", options: ["sm", "md"] },
    disabled: { control: "boolean" },
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: "primary" },
};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const Fellowship: Story = {
  args: { variant: "fellowship", children: "Start your Fellowship" },
};

export const Disabled: Story = {
  args: { variant: "primary", disabled: true },
};

export const Small: Story = {
  args: { size: "sm", variant: "fellowship", children: "Resume" },
};

export const WithStartIcon: Story = {
  args: {
    variant: "fellowship",
    startIcon: <span aria-hidden>+</span>,
    children: "Invite team member",
  },
};
