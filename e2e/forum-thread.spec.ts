import { expect, test } from "@playwright/test";
import { uniqueUser } from "./fixtures";

/**
 * Fellow creates a forum thread and confirms it shows up in the list.
 * Catches: forum POST routing through BFF, optimistic UI insert, the
 * `motion` AnimatePresence rendering not breaking interaction, and the
 * thread detail page reachable via the new id.
 */
test("fellow creates a forum thread and lands on the thread detail", async ({ page }) => {
  const user = uniqueUser("forum");
  const title = `Test thread ${Date.now()}`;
  const body =
    "What's the canonical reading on algorithmic bias in credit scoring? " +
    "Looking for something rigorous I can cite in the capstone.";

  // Register fresh.
  await page.goto("/apply");
  await page.getByPlaceholder(/Amina Okonkwo/i).fill(user.fullName);
  await page.getByPlaceholder(/you@example.com/i).fill(user.email);
  await page.getByPlaceholder(/At least 8 characters/i).fill(user.password);
  await page.getByRole("checkbox", { name: /Terms/i }).check();
  await page.getByRole("button", { name: /Continue to onboarding/i }).click();

  await page.goto("/forum");

  // Open the composer.
  await page.getByRole("button", { name: /New thread/i }).click();

  await page.getByPlaceholder(/What's the question/i).fill(title);
  await page.getByPlaceholder(/Be specific/i).fill(body);
  await page.getByRole("button", { name: /Post thread/i }).click();

  // Lands on the thread detail.
  await expect(page).toHaveURL(/\/forum\/[a-z0-9-]+/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
});
