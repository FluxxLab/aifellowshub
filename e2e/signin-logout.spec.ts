import { expect, test } from "@playwright/test";
import { uniqueUser } from "./fixtures";

/**
 * Sign in with an existing user, then sign out and verify the cookie
 * is gone (logout invalidated server-side; backing /home requires auth).
 *
 * Pre-creates the user via the register flow so the test is
 * self-contained.
 */
test("signin → /home, then logout invalidates the session", async ({ page }) => {
  const user = uniqueUser("returning");

  // Pre-register via the apply form.
  await page.goto("/apply");
  await page.getByPlaceholder(/Amina Okonkwo/i).fill(user.fullName);
  await page.getByPlaceholder(/you@example.com/i).fill(user.email);
  await page.getByPlaceholder(/At least 8 characters/i).fill(user.password);
  await page.getByRole("checkbox", { name: /Terms/i }).check();
  await page.getByRole("button", { name: /Continue to onboarding/i }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  // Skip onboarding — for this test we only care about signin/logout.
  // Force them to /home with their existing cookie. The PasswordChangeGate
  // and the layout will handle missing fields gracefully (they're nullable).
  // Logout to clear state.
  await page.context().clearCookies();

  // Sign in.
  await page.goto("/signin");
  await page.getByPlaceholder(/info@gmail\.com/i).fill(user.email);
  await page.getByPlaceholder(/Enter your password/i).fill(user.password);
  await page.getByRole("button", { name: /^Sign In$/i }).click();

  await expect(page).toHaveURL(/\/(home|dashboard|onboarding|change-password)/);

  // Whatever the post-login destination, the user dropdown is in the header.
  // Click it and use the Sign out option.
  await page.locator("header").getByRole("button").last().click();
  await page.getByRole("button", { name: /Sign out/i }).click();

  // Should land on signin (or apply / public landing). Now try to hit a
  // protected page directly — the layout's getCurrentUser redirects to
  // /signin because the cookie is dead.
  await page.goto("/home");
  await expect(page).toHaveURL(/\/signin/);
});
