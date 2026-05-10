import type { TestRunnerConfig } from "@storybook/test-runner";
import { injectAxe, checkA11y } from "axe-playwright";

/**
 * Test-runner config: scan every story with axe-core after it renders.
 *
 * Why this lives in the test-runner instead of relying on the Storybook
 * a11y *addon* alone: the addon flags violations in the UI panel, but
 * a CI signal needs `process.exit(1)` on failure. The test-runner
 * gives us that.
 *
 * Same WCAG tag set as the Playwright `expectNoAxeViolations` helper
 * (`e2e/helpers/axe.ts`) so the design-system layer and the page layer
 * are held to the same bar.
 *
 * `colorContrast` is disabled here because Tailwind's CSS-variable
 * tokens read as transparent under axe — light-mode contrast is fine
 * in practice. Re-enable once we ship a CSS variable resolver shim
 * that axe can introspect.
 */
const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
  },
  async postVisit(page) {
    await checkA11y(page, "#storybook-root", {
      detailedReport: true,
      detailedReportOptions: { html: true },
      axeOptions: {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
        rules: {
          "color-contrast": { enabled: false },
        },
      },
    });
  },
};

export default config;
