import { expect, test } from "@playwright/test";
import { uniqueUser } from "./fixtures";

/**
 * Fellow opens their capstone, types a draft, saves it, and the saved
 * indicator appears. Doesn't go all the way to submit-for-review (the
 * backend e2e suite already covers the lifecycle); this test is about
 * the UI ↔ BFF ↔ backend ↔ DB chain working end-to-end through the
 * browser, which the unit/e2e backend tests can't see.
 */
test("fellow drafts and saves their capstone", async ({ page }) => {
  const user = uniqueUser("capstone");

  // Register (then skip onboarding by going straight to my-capstone — the
  // page is reachable without onboarding completion).
  await page.goto("/apply");
  await page.getByPlaceholder(/Amina Okonkwo/i).fill(user.fullName);
  await page.getByPlaceholder(/you@example.com/i).fill(user.email);
  await page.getByPlaceholder(/At least 8 characters/i).fill(user.password);
  await page.getByRole("checkbox", { name: /Terms/i }).check();
  await page.getByRole("button", { name: /Continue to onboarding/i }).click();
  await expect(page).toHaveURL(/\/onboarding/);

  // Jump straight to capstone — onboarding is a UX prompt, not a hard gate.
  await page.goto("/my-capstone");

  // Type a problem statement and save.
  const problem = page.getByPlaceholder(/problem statement|harm or governance gap/i).first();
  await problem.waitFor({ state: "visible" });
  await problem.fill(
    "Sub-Saharan credit-scoring models systematically under-rate informal-economy borrowers, locking them out of credit.",
  );

  // The Save action is the primary CTA on the draft surface.
  const save = page.getByRole("button", { name: /^Save( draft)?$/i }).first();
  await save.click();

  // Toast or success indicator should appear within a few seconds.
  await expect(
    page.getByText(/Saved|saved at|capstone.*saved/i).first(),
  ).toBeVisible({ timeout: 10_000 });
});
