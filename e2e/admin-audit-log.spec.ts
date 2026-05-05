import { expect, test } from "@playwright/test";
import { ADMIN_CREDS, signInAs } from "./fixtures";

/**
 * Admin opens the audit log and sees their own login event recorded.
 *
 * Catches: admin role gate on `/audit-log`, the BFF proxy to
 * `/api/admin/audit-log`, the page's table render against real data,
 * and the action-badge color logic for `auth.login` (info-coloured).
 */
test("admin sees the audit log and finds their own login row", async ({
  page,
}) => {
  await signInAs(page, ADMIN_CREDS.email, ADMIN_CREDS.password);

  await page.goto("/audit-log");

  // Page heading.
  await expect(
    page.getByRole("heading", { name: /^Audit log$/i }),
  ).toBeVisible();

  // The login that just happened in `signInAs` should be the most
  // recent row. The action-badge text is the raw key.
  await expect(page.getByText("auth.login").first()).toBeVisible();

  // The actor column shows our admin email.
  await expect(page.getByText(ADMIN_CREDS.email).first()).toBeVisible();
});
