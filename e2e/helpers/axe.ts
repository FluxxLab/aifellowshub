import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/**
 * Run an axe-core scan and assert no WCAG 2.1 A or AA violations.
 *
 * Why a helper instead of inlining: WCAG 2.1 AA is the BRD §7 target,
 * and the right way to enforce it is the same scan + same exclusions
 * everywhere. Specs that need a different scope can pass `selector`
 * (e.g. only the main content) or `disableRules` (e.g. for a known
 * third-party widget that violates a rule we can't control).
 *
 * The scan is opinionated:
 *   - Tags include 2.1 A + AA, plus best-practice rules that catch
 *     common regressions (heading-order, region, label).
 *   - `colorContrast` is intentionally NOT excluded — it's the most
 *     common violation in design-system work and worth surfacing
 *     loudly. Override with `disableRules: ['color-contrast']` only
 *     when you're confident the contrast is fine but axe is reading
 *     a CSS variable as transparent (a known limitation).
 *   - `focus-order-semantics` and `landmark-one-main` are excluded
 *     by default — they're guidance, not violations.
 */
export async function expectNoAxeViolations(
  page: Page,
  options?: {
    selector?: string;
    disableRules?: string[];
  },
): Promise<void> {
  let builder = new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
    .disableRules(["focus-order-semantics", "landmark-one-main"]);

  if (options?.selector) {
    builder = builder.include(options.selector);
  }
  if (options?.disableRules && options.disableRules.length > 0) {
    builder = builder.disableRules(options.disableRules);
  }

  const results = await builder.analyze();

  // Surface the violations clearly when the assertion fails — by
  // default Playwright would just say "expected [] === [...]" with
  // the full nodes blob, which is unreadable.
  if (results.violations.length > 0) {
    const summary = results.violations
      .map(
        (v) =>
          `  - ${v.id} (${v.impact ?? "n/a"}): ${v.help}\n    ${v.helpUrl}`,
      )
      .join("\n");
    throw new Error(
      `axe-core found ${results.violations.length} accessibility violation(s):\n${summary}`,
    );
  }

  // Belt-and-braces — the throw above is the primary signal but this
  // keeps the assertion visible in test reports.
  expect(results.violations).toEqual([]);
}
