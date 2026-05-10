import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserDropdown from "./UserDropdown";

/**
 * UserDropdown is the only place "Restart tour" lives, so the
 * tour-state wipe is its load-bearing behaviour. The sign-out path
 * matters too because it's the user's escape hatch when something
 * else in the app is broken — it must not fail closed.
 *
 * `useCurrentUser` is mocked because the real hook hits `/api/auth/me`
 * over the network on mount. `useRouter` is mocked because the dropdown
 * triggers `router.push` + `router.refresh`, both of which throw in
 * jsdom without a router provider.
 */

const pushMock = vi.fn();
const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => ({
    id: "u-1",
    fullName: "Ada Lovelace",
    email: "ada@example.test",
    role: "fellow" as const,
    avatarUrl: "/images/user/owner.jpg",
    mustChangePassword: false,
  }),
}));

beforeEach(() => {
  pushMock.mockReset();
  refreshMock.mockReset();
  fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("UserDropdown", () => {
  it("shows the user's first name and full name in the header trigger", () => {
    render(<UserDropdown />);
    // Trigger button shows first name only.
    expect(screen.getByText("Ada")).toBeInTheDocument();
  });

  it("does not render the menu items until the trigger is clicked", () => {
    render(<UserDropdown />);
    // "Restart tour" is inside the closed dropdown — Dropdown returns null when closed.
    expect(screen.queryByText(/Restart tour/i)).not.toBeInTheDocument();
  });

  it("opens the dropdown on click and reveals Edit profile, Restart tour, Sign out", async () => {
    render(<UserDropdown />);
    await userEvent.click(screen.getByRole("button", { name: /Ada/i }));
    expect(screen.getByText(/Edit profile/i)).toBeInTheDocument();
    expect(screen.getByText(/Restart tour/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign out/i)).toBeInTheDocument();
  });

  it("Edit profile link points to /my-profile for fellows", async () => {
    render(<UserDropdown />);
    await userEvent.click(screen.getByRole("button", { name: /Ada/i }));
    const link = screen.getByRole("link", { name: /Edit profile/i });
    expect(link).toHaveAttribute("href", "/my-profile");
  });

  it("Restart tour wipes every pic-lms-tour: localStorage key", async () => {
    window.localStorage.setItem("pic-lms-tour:home", "2026-05-01");
    window.localStorage.setItem("pic-lms-tour:learning", "2026-05-02");
    window.localStorage.setItem("pic-lms-tour:my-sessions", "2026-05-03");
    // Unrelated keys must survive — the wipe is namespace-scoped.
    window.localStorage.setItem("pic-lms-other", "keep-me");

    render(<UserDropdown />);
    await userEvent.click(screen.getByRole("button", { name: /Ada/i }));
    await userEvent.click(screen.getByRole("button", { name: /Restart tour/i }));

    expect(window.localStorage.getItem("pic-lms-tour:home")).toBeNull();
    expect(window.localStorage.getItem("pic-lms-tour:learning")).toBeNull();
    expect(window.localStorage.getItem("pic-lms-tour:my-sessions")).toBeNull();
    expect(window.localStorage.getItem("pic-lms-other")).toBe("keep-me");
  });

  it("Restart tour navigates a fellow back to /home", async () => {
    render(<UserDropdown />);
    await userEvent.click(screen.getByRole("button", { name: /Ada/i }));
    await userEvent.click(screen.getByRole("button", { name: /Restart tour/i }));

    expect(pushMock).toHaveBeenCalledWith("/home");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("Sign out posts to the logout endpoint and routes to /signin", async () => {
    render(<UserDropdown />);
    await userEvent.click(screen.getByRole("button", { name: /Ada/i }));
    await userEvent.click(screen.getByRole("button", { name: /Sign out/i }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    expect(pushMock).toHaveBeenCalledWith("/signin");
  });

  it("Sign out still navigates to /signin even when the logout fetch rejects", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    render(<UserDropdown />);
    await userEvent.click(screen.getByRole("button", { name: /Ada/i }));
    await userEvent.click(screen.getByRole("button", { name: /Sign out/i }));

    expect(pushMock).toHaveBeenCalledWith("/signin");
  });
});
