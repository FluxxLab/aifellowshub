import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import Tour, { tourStorageKey } from "./Tour";

/**
 * Tour gating contract tests.
 *
 * The component is small but the gating logic is load-bearing — every
 * tour now relies on it instead of a server-side flag, so the page-key
 * → localStorage round-trip and the prefers-reduced-motion shortcut
 * both need to keep working.
 */

const STEPS = [
  {
    element: '[data-tour="welcome"]',
    popover: { title: "Hi", description: "Hello" },
  },
];

afterEach(() => {
  vi.useRealTimers();
});

describe("tourStorageKey", () => {
  it("namespaces page keys under the shared prefix", () => {
    expect(tourStorageKey("home")).toBe("pic-lms-tour:home");
    expect(tourStorageKey("admin-dashboard")).toBe(
      "pic-lms-tour:admin-dashboard",
    );
  });
});

describe("Tour", () => {
  it("short-circuits when the page key is already in localStorage", () => {
    window.localStorage.setItem(tourStorageKey("home"), "2026-05-10T00:00:00Z");
    vi.useFakeTimers();

    render(<Tour pageKey="home" steps={STEPS} />);
    vi.advanceTimersByTime(1000);

    // No popover should render.
    expect(document.querySelector(".pic-lms-tour")).toBeNull();
    // And the existing flag is preserved (not rewritten).
    expect(window.localStorage.getItem(tourStorageKey("home"))).toBe(
      "2026-05-10T00:00:00Z",
    );
  });

  it("respects prefers-reduced-motion: skips the tour and marks seen", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query.includes("prefers-reduced-motion"),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    render(<Tour pageKey="learning" steps={STEPS} />);

    // Reduced-motion exit fires synchronously inside the effect, so the
    // flag should be present without needing to advance any timer.
    expect(window.localStorage.getItem(tourStorageKey("learning"))).toBeTruthy();
  });

  it("renders nothing visually (it's a side-effect-only component)", () => {
    const { container } = render(<Tour pageKey="my-sessions" steps={STEPS} />);
    expect(container.firstChild).toBeNull();
  });

  it("does not throw when localStorage.getItem throws (private browsing)", () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error("QuotaExceededError");
    };

    try {
      // Don't useFakeTimers here — the contract is just "render doesn't
      // crash when storage is unusable", not anything about driver.js
      // having actually started up. The component returns null before
      // any UI is mounted regardless.
      expect(() =>
        render(<Tour pageKey="ai-buddy" steps={STEPS} />),
      ).not.toThrow();
    } finally {
      Storage.prototype.getItem = original;
    }
  });
});
