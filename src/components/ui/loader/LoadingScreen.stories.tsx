import type { Meta, StoryObj } from "@storybook/react";
import LoadingScreen from "./LoadingScreen";

/**
 * The full-page (or full-section) loader. Used by every role's
 * route-segment `loading.tsx` so the layout shell stays visible while
 * the page's server component fetches data.
 */
const meta: Meta<typeof LoadingScreen> = {
  title: "Primitives/LoadingScreen",
  component: LoadingScreen,
  argTypes: {
    label: { control: "text" },
    variant: { control: "inline-radio", options: ["inline", "fullScreen"] },
  },
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof LoadingScreen>;

export const Inline: Story = {
  args: { label: "Loading…", variant: "inline" },
};

export const FullScreen: Story = {
  args: { label: "Loading dashboard…", variant: "fullScreen" },
};

export const ContextualLabel: Story = {
  args: { label: "Fetching capstone feedback…", variant: "inline" },
};
