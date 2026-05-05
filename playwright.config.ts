import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the LMS critical-journey suite.
 *
 * The tests assume both the frontend (Next 16) and the backend (NestJS)
 * are already running. Local dev: `docker compose up` from the backend
 * repo. CI: the workflow boots them via docker compose before running.
 *
 * Override the URL with `PLAYWRIGHT_BASE_URL` if your local frontend
 * isn't on `:3000`.
 */
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // Each spec is independent (uses unique emails) so we can parallelise.
  fullyParallel: true,
  // CI must NOT have `test.only` left in. Locally it's fine to leave
  // for fast iteration.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  // Reasonable defaults for a Nest+Next stack: register/login takes a
  // beat (bcrypt rounds=13), and DB-backed reads can be slow on cold
  // CI runners.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Cookie domain in the backend defaults to undefined (host-only),
    // so tests using cookies don't need any special config here.
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // Mobile-tagged specs run only in the `mobile` project below.
      testIgnore: /.*\.mobile\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"] },
      testMatch: /.*\.mobile\.spec\.ts/,
    },
  ],
});
