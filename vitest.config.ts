/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

/**
 * Component-level test runner.
 *
 * Vitest + jsdom + RTL handles the small unit + component cases — Tour
 * gating, primitive prop spreads, auth helpers. End-to-end coverage
 * lives in `e2e/` (Playwright) and is intentionally out of scope here:
 * jsdom can't render the Next router or hit a real backend.
 *
 * `resolve.tsconfigPaths` mirrors production's `@/...` aliases so specs
 * import the same way the app does, no per-file overrides.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", "e2e", ".next"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/**/__tests__/**",
        "src/app/**/page.tsx",
        "src/app/**/layout.tsx",
        "src/app/**/route.ts",
      ],
    },
  },
});
