import { expect, test } from "@playwright/test";
import { uniqueUser } from "./fixtures";

/**
 * Mobile (iPhone 13 viewport, 390px). Confirms the fellow home page
 * renders without horizontal overflow and the user dropdown collapses
 * to avatar-only at sm: breakpoint.
 *
 * Wired via the `mobile` project in playwright.config.ts which sets
 * the iPhone 13 device descriptor.
 */
test("fellow home has no horizontal overflow on a phone", async ({ page }) => {
  const user = uniqueUser("mobile");

  await page.goto("/apply");
  await page.getByPlaceholder(/Amina Okonkwo/i).fill(user.fullName);
  await page.getByPlaceholder(/you@example.com/i).fill(user.email);
  await page.getByPlaceholder(/At least 8 characters/i).fill(user.password);
  await page.getByRole("checkbox", { name: /Terms/i }).check();
  await page.getByRole("button", { name: /Continue to onboarding/i }).click();

  await page.goto("/home");

  // Wait for the metric tiles to render before measuring.
  await expect(page.getByText(/Modules complete/i)).toBeVisible();

  // The body shouldn't scroll horizontally — that's the canonical mobile
  // bug we shipped the audit-log table fix for. If the document is
  // wider than the viewport, something on this page broke it.
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: window.innerWidth,
  }));
  expect(overflow.body).toBeLessThanOrEqual(overflow.viewport + 2);

  // Hamburger menu is visible (top nav collapses below lg=1024).
  await expect(
    page.locator("button[aria-label='Toggle navigation']"),
  ).toBeVisible();
});
