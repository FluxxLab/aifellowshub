import type { StorybookConfig } from "@storybook/nextjs";

/**
 * Storybook configuration.
 *
 * Scope is intentionally narrow: the design-system primitives in
 * `src/components/ui`. We're not stitching every page into Storybook —
 * pages depend on the Next router, server components, and the auth
 * layer, which Storybook can't usefully simulate. Stories on the
 * primitives give us:
 *   - visual review of every variant before it ships
 *   - axe-core accessibility scans via `addon-a11y`
 *   - a living spec for the prop surface (`autodocs`)
 *
 * If a future shared composite component (e.g. ConfirmDialog) becomes
 * worth reviewing in isolation, add a `*.stories.tsx` next to it and
 * Storybook will pick it up via the glob below.
 */
const config: StorybookConfig = {
  stories: ["../src/components/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  docs: {
    defaultName: "Docs",
  },
  staticDirs: ["../public"],
};

export default config;
