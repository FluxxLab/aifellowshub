import type { Meta, StoryObj } from "@storybook/react";
import AvatarText from "./AvatarText";

/**
 * AvatarText derives initials + a deterministic palette from the
 * user's full name. Used in headers, tables, mentor queues — anywhere
 * we'd otherwise need a profile picture URL.
 *
 * Why deterministic: the same name should always pick the same colour
 * across renders, sessions, and devices. If you've added a new entry
 * to the palette, render the `PaletteSweep` story to make sure the
 * distribution still looks balanced.
 */
const meta: Meta<typeof AvatarText> = {
  title: "Primitives/AvatarText",
  component: AvatarText,
  args: {
    name: "Ada Lovelace",
  },
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof AvatarText>;

export const Default: Story = {};

export const SingleWord: Story = {
  args: { name: "Ngozi" },
};

export const Empty: Story = {
  // Defensive — when fullName isn't available yet (loading state) we
  // render `?` rather than crashing on a split.
  args: { name: "" },
};

export const Large: Story = {
  args: { className: "h-16 w-16 text-lg" },
};

export const PaletteSweep: Story = {
  // Quick visual regression aid: drop a few names from across the
  // alphabet and see the deterministic colour assignment in action.
  render: () => (
    <div className="flex flex-wrap gap-3">
      {[
        "Ada Lovelace",
        "Bola Adekunle",
        "Chika Obi",
        "Dami Olu",
        "Esi Mensah",
        "Fatima Bello",
        "Gbenga Ade",
        "Hadiza Yusuf",
        "Ifeoma Okeke",
        "Joseph Mwangi",
        "Kemi Akin",
        "Lara Diop",
      ].map((n) => (
        <div key={n} className="flex flex-col items-center gap-1">
          <AvatarText name={n} />
          <span className="text-xs text-gray-500">{n}</span>
        </div>
      ))}
    </div>
  ),
};
