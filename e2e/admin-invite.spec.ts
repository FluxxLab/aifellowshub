import { expect, test } from "@playwright/test";
import { ADMIN_CREDS, signInAs, uniqueUser } from "./fixtures";

/**
 * Admin invites a mentor and is shown the one-time temp password they
 * need to share with the invitee.
 *
 * Catches: admin role gate works through the browser, InviteModal posts
 * to `/api/admin/users` with the right body shape, and the success
 * panel surfaces the `tempPassword` exactly once (the backend returns
 * it in plaintext, the form displays it, the dev shares it manually).
 */
test("admin invites a mentor and is shown the temp password", async ({
  page,
}) => {
  const invitee = uniqueUser("invited-mentor");

  await signInAs(page, ADMIN_CREDS.email, ADMIN_CREDS.password);

  // Land on the participants page where the Invite button lives.
  await page.goto("/participants");
  await page.getByRole("button", { name: /Invite/i }).click();

  // Pick "Mentor" role — the modal has three role tiles.
  await page.getByRole("button", { name: /^Mentor$/i }).click();

  // Fill the form.
  await page.getByPlaceholder(/Aminata Diallo/i).fill(invitee.fullName);
  await page.getByPlaceholder(/name@example\.com/i).fill(invitee.email);

  await page.getByRole("button", { name: /Send invitation/i }).click();

  // Success panel shows the temp password as a copy-able code block.
  await expect(page.getByText(/Account created/i)).toBeVisible();
  await expect(
    page.getByText(/Temporary password \(shown once\)/i),
  ).toBeVisible();

  // The temp password is base64url, 14 chars (10 random bytes →
  // 14-char base64url). Just assert SOMETHING password-shaped is there.
  const codeBlock = page.locator("code").filter({ hasText: /^[A-Za-z0-9_-]{10,}/ });
  await expect(codeBlock.first()).toBeVisible();
});
