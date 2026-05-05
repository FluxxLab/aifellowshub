/**
 * Shared Playwright fixtures + helpers.
 *
 * Tests run in parallel against a shared backend, so each test creates
 * its own user with a unique email — no DB reset needed between specs.
 * If the test DB ever gets cluttered, restart `docker compose down -v`.
 *
 * The seeded admin (created by the backend's `prisma/e2e-seed.ts`) is
 * the one shared user — admin specs sign in as them via `ADMIN_CREDS`.
 */
import { randomUUID } from "node:crypto";
import type { Page } from "@playwright/test";

const STRONG_PASSWORD = "Hunter22-strong!";

/**
 * Generate a one-shot test email + name. Tag the prefix so it's easy
 * to grep these out of the DB later.
 */
export function uniqueUser(prefix = "fellow") {
  const id = randomUUID().slice(0, 8);
  return {
    fullName: `${prefix.charAt(0).toUpperCase()}${prefix.slice(1)} Test ${id}`,
    email: `e2e-${prefix}-${id}@example.test`,
    password: STRONG_PASSWORD,
  };
}

/**
 * Credentials for the seeded admin. Match the defaults in the backend's
 * `prisma/e2e-seed.ts`; override via `E2E_ADMIN_EMAIL` /
 * `E2E_ADMIN_PASSWORD` if you re-seeded with different values.
 */
export const ADMIN_CREDS = {
  email: process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@example.test",
  password: process.env.E2E_ADMIN_PASSWORD ?? "Hunter22-e2e-admin!",
};

/**
 * Drive the sign-in form for an existing user. Returns once the
 * post-login redirect has settled (any of /home, /dashboard,
 * /onboarding, /change-password — the layout decides).
 */
export async function signInAs(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/signin");
  await page.getByPlaceholder(/info@gmail\.com/i).fill(email);
  await page.getByPlaceholder(/Enter your password/i).fill(password);
  await page.getByRole("button", { name: /^Sign In$/i }).click();
  await page.waitForURL(
    /\/(home|dashboard|onboarding|change-password|mentor|faculty)/,
    { timeout: 15_000 },
  );
}

/**
 * Register a new fellow via the public apply form. Returns when the
 * form has redirected to /onboarding. Use it in fellow journey tests
 * that don't care about the wizard itself.
 */
export async function registerFellowViaUi(
  page: Page,
  user: ReturnType<typeof uniqueUser>,
): Promise<void> {
  await page.goto("/apply");
  await page.getByPlaceholder(/Amina Okonkwo/i).fill(user.fullName);
  await page.getByPlaceholder(/you@example.com/i).fill(user.email);
  await page.getByPlaceholder(/At least 8 characters/i).fill(user.password);
  await page.getByRole("checkbox", { name: /Terms/i }).check();
  await page.getByRole("button", { name: /Continue to onboarding/i }).click();
  await page.waitForURL(/\/onboarding/, { timeout: 15_000 });
}

export const CONSTANTS = {
  PASSWORD: STRONG_PASSWORD,
};
