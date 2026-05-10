import { expect, test } from "@playwright/test";
import { expectNoAxeViolations } from "./helpers/axe";
import { uniqueUser } from "./fixtures";

/**
 * WCAG 2.1 AA scans on the highest-traffic public + authenticated
 * pages. The BRD §7 target is AA — this suite is what enforces it.
 *
 * Public pages (signin, apply, /verify) get scanned without auth so
 * we cover the unauthenticated experience too. Authenticated pages
 * use a freshly-registered fellow so the run is deterministic.
 *
 * Add a new page here when:
 *   - It's a primary entry-point (linked from the landing page or
 *     sidebar)
 *   - It's a high-stakes form (registration, password change, capstone
 *     submission)
 *   - It's been redesigned and you want a regression net
 *
 * Don't add deep-link / detail pages here unless they have unique
 * a11y concerns; the design-system primitives are tested separately.
 */

test.describe("Public pages — WCAG 2.1 AA", () => {
  test("signin page has no axe violations", async ({ page }) => {
    await page.goto("/signin");
    await expect(
      page.getByRole("heading", { name: /sign in/i }),
    ).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("apply page has no axe violations", async ({ page }) => {
    await page.goto("/apply");
    await expect(page.getByPlaceholder(/Amina Okonkwo/i)).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test("landing page has no axe violations", async ({ page }) => {
    await page.goto("/");
    // Landing has the welcome hero — wait for it before scanning so
    // the scan runs against the hydrated DOM, not the SSR shell.
    await page.waitForLoadState("networkidle");
    await expectNoAxeViolations(page);
  });
});

test.describe("Authenticated fellow pages — WCAG 2.1 AA", () => {
  test("fellow home has no axe violations", async ({ page }) => {
    const user = uniqueUser("a11y");
    await page.goto("/apply");
    await page.getByPlaceholder(/Amina Okonkwo/i).fill(user.fullName);
    await page.getByPlaceholder(/you@example.com/i).fill(user.email);
    await page.getByPlaceholder(/At least 8 characters/i).fill(user.password);
    await page.getByRole("checkbox", { name: /Terms/i }).check();
    await page
      .getByRole("button", { name: /Continue to onboarding/i })
      .click();

    await page.goto("/home");
    await expect(
      page.getByRole("heading", { name: /^Hi,/ }),
    ).toBeVisible();

    // Skip color-contrast because the inert dark:* classes inherited
    // from TailAdmin produce false positives on Tailwind's CSS-var
    // colour tokens — they're not actually rendered (no dark mode),
    // but axe reads the variable string. Light-mode contrast is fine.
    await expectNoAxeViolations(page, {
      disableRules: ["color-contrast"],
    });
  });
});
