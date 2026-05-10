import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * Global test setup.
 *
 *  - `@testing-library/jest-dom/vitest` adds matchers like
 *    `toBeInTheDocument` to vitest's `expect`.
 *  - `cleanup()` runs between tests so React state from one spec can't
 *    bleed into the next (Vitest doesn't auto-cleanup like Jest used to).
 *  - `localStorage` and `matchMedia` get reset / mocked because jsdom
 *    doesn't ship a usable matchMedia and Tour reads it on every mount.
 */

beforeEach(() => {
  // Reset storage so per-page tour gating starts each test from zero.
  window.localStorage.clear();

  // jsdom has no matchMedia by default. Default to "no match" so tours
  // run as if on desktop without prefers-reduced-motion. Specs that need
  // a different match override this with `vi.spyOn(window, "matchMedia")`.
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
