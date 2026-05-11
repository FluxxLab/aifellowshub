import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/**
 * Stub `@sentry/nextjs` for all tests. The real module wires into
 * Next's runtime + browser globals and explodes inside jsdom; we
 * don't want every component test to fail just because it touches a
 * file that re-exports a Sentry helper (e.g. `app/layout.tsx`'s
 * `Sentry.getTraceData`). Tests don't assert on Sentry behaviour —
 * production builds use the real module via `next build`.
 */
vi.mock("@sentry/nextjs", () => ({
  getTraceData: () => ({}),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
  init: vi.fn(),
  replayIntegration: () => ({}),
  withSentryConfig: <T>(config: T) => config,
}));

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

  // jsdom doesn't implement Element.scrollTo. Several components
  // (AiBuddyChat's auto-scroll-to-latest, ForumChat's similar) call
  // it inside an effect and crash without this no-op shim.
  if (!Element.prototype.scrollTo) {
    Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
  }
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
