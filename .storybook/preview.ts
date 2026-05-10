import type { Preview } from "@storybook/react";
import "../src/app/globals.css";

/**
 * Global Storybook preview config.
 *
 * `globals.css` is imported here so every story renders against the
 * same Tailwind tokens, custom font, and design-system layer that
 * production uses — no "looks fine in Storybook, broken in app"
 * surprises. The a11y addon's defaults match WCAG 2.1 AA, the BRD
 * §7 target.
 */
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "navy panel", value: "#0b1c34" },
      ],
    },
    a11y: {
      // WCAG 2.1 AA per BRD §7. Keep this in sync with the Playwright
      // axe helper's tag list (e2e/helpers/axe.ts).
      element: "#storybook-root",
      config: {},
      options: {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
      },
    },
  },
  tags: ["autodocs"],
};

export default preview;
