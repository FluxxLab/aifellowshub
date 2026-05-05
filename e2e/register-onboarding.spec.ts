import { expect, test } from "@playwright/test";
import { uniqueUser } from "./fixtures";

/**
 * Register → onboarding wizard → /home.
 *
 * Catches the most-likely break in the auth chain: BFF cookie, JWT
 * verification on the next request, ConfigService env wiring, and the
 * onboarding wizard's `useConfirm` modal flow.
 */
test("register → onboarding wizard → land on /home", async ({ page }) => {
  const user = uniqueUser("fellow");

  await page.goto("/apply");

  // The apply form has only one cohort variant by default — fill it.
  await page.getByPlaceholder(/Amina Okonkwo/i).fill(user.fullName);
  await page.getByPlaceholder(/you@example.com/i).fill(user.email);
  await page.getByPlaceholder(/At least 8 characters/i).fill(user.password);
  await page.getByRole("checkbox", { name: /Terms/i }).check();
  await page.getByRole("button", { name: /Continue to onboarding/i }).click();

  // Onboarding wizard — step 1: country, organisation, job title.
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByText(/Step 1 of 4/i).waitFor();

  // Country uses a custom SelectField — open + pick.
  await page.locator('[role="combobox"], button').filter({ hasText: /Select your country/i }).first().click();
  await page.getByRole("option", { name: "Nigeria" }).click();
  await page.getByPlaceholder(/Ministry of Health/i).fill("Independent");
  await page.getByPlaceholder(/Policy Analyst/i).fill("Researcher");
  await page.getByRole("button", { name: /Continue/i }).click();

  // Step 2: sector + bio.
  await page.getByRole("button", { name: /^Health AI$/ }).click();
  await page
    .getByPlaceholder(/A couple of sentences/i)
    .fill(
      "AI policy researcher focused on credit access in Sub-Saharan Africa.",
    );
  await page.getByRole("button", { name: /Continue/i }).click();

  // Step 3: goals.
  await page
    .getByPlaceholder(/Build practical skills/i)
    .fill("Ship policy work that meaningfully improves credit fairness.");
  await page.getByRole("button", { name: /Continue/i }).click();

  // Step 4: review + finish.
  await page.getByRole("button", { name: /Finish & enter Fellowship/i }).click();

  await expect(page).toHaveURL(/\/home/);
  // The fellow's first name is in the heading.
  await expect(
    page.getByRole("heading", { name: new RegExp(user.fullName.split(" ")[0]) }),
  ).toBeVisible();
});
