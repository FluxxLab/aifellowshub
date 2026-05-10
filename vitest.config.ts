/// <reference types="vitest" />
import { defineConfig, type Plugin } from "vitest/config";
import path from "node:path";
import react from "@vitejs/plugin-react";

const SVG_STUB = path.resolve(__dirname, "./vitest.svg-stub.tsx");

/**
 * Resolve every `*.svg` import to the test stub. Done as an explicit
 * plugin (rather than `resolve.alias`) because Vite's regex-alias path
 * runs after asset detection — Vite would normally treat `.svg` as a
 * static asset and never even look at our alias entry.
 */
function svgStubPlugin(): Plugin {
  return {
    name: "vitest:svg-stub",
    enforce: "pre",
    async resolveId(source, importer) {
      if (!source.endsWith(".svg")) return null;
      // Resolve the original path so re-imports of the same SVG share an
      // identity, then redirect to the stub. Returning the stub path
      // directly is sufficient — no need to keep the original.
      const _ = importer; // unused but kept for clarity
      return SVG_STUB;
    },
  };
}

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
 *
 * SVG handling: production uses `@svgr/webpack` (next.config.mjs) to
 * convert each SVG into a React component. Vitest doesn't run that
 * loader, so we point every `*.svg` resolution at a stub component
 * via `resolve.alias`. Tests don't care what the icon looks like —
 * just that it renders a shell + accepts props.
 */
export default defineConfig({
  plugins: [svgStubPlugin(), react()],
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
