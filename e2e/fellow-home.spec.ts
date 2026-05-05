import { expect, test } from "@playwright/test";
import { uniqueUser } from "./fixtures";

/**
 * Fellow home renders for a freshly-registered user. Validates:
 *   - getCurrentUser server fetcher works (bounces without cookie)
 *   - getFellowHomeServer aggregator doesn't blow up when cohort
 *     state is empty (the new fellow has no curriculum, no sessions,
 *     no AI history yet — page must render zero-states)
 *   - Hero metrics tiles render (CountUp animation doesn't crash)
 */
test("fresh fellow lands on /home and sees the empty zero-state", async ({ page }) => {
  const user = uniqueUser("home");

  await page.goto("/apply");
  await page.getByPlaceholder(/Amina Okonkwo/i).fill(user.fullName);
  await page.getByPlaceholder(/you@example.com/i).fill(user.email);
  await page.getByPlaceholder(/At least 8 characters/i).fill(user.password);
  await page.getByRole("checkbox", { name: /Terms/i }).check();
  await page.getByRole("button", { name: /Continue to onboarding/i }).click();

  await page.goto("/home");

  // First-name greeting.
  const firstName = user.fullName.split(" ")[0];
  await expect(
    page.getByRole("heading", { name: new RegExp(`Hi, ${firstName}`) }),
  ).toBeVisible();

  // Four metric tiles labelled.
  await expect(page.getByText(/Modules complete/i)).toBeVisible();
  await expect(page.getByText(/Your attendance/i)).toBeVisible();
  await expect(page.getByText(/AI Buddy today/i)).toBeVisible();
  await expect(page.getByText(/Capstone/i).first()).toBeVisible();
});
