import { describe, expect, it } from "vitest";
import { LOADING_USER } from "./users";

/**
 * The loading placeholder is a small surface but consumers rely on
 * `id === ""` to detect the pre-hydration state, so any rename or
 * accidental "demo user" backslide should be loud.
 */
describe("LOADING_USER", () => {
  it("uses an empty id so consumers can detect pre-hydration", () => {
    expect(LOADING_USER.id).toBe("");
  });

  it("has empty fullName + email — no leaked demo identity", () => {
    expect(LOADING_USER.fullName).toBe("");
    expect(LOADING_USER.email).toBe("");
  });

  it("defaults to fellow (the most-restrictive role)", () => {
    expect(LOADING_USER.role).toBe("fellow");
  });

  it("defaults mustChangePassword to false so the gate doesn't trigger pre-hydration", () => {
    expect(LOADING_USER.mustChangePassword).toBe(false);
  });

  it("does not carry the legacy hasSeenTour flag", () => {
    // Per the localStorage migration, `hasSeenTour` is no longer part
    // of `CurrentUser`. Guarding here so a future drive-by refactor
    // doesn't quietly add it back.
    expect(LOADING_USER).not.toHaveProperty("hasSeenTour");
  });
});
