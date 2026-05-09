// `.js` extensions are required — eslint-config-next exposes these as
// concrete files, and Node's ESM loader won't infer extensions on
// non-package-conditional paths.
import nextVitals from "eslint-config-next/core-web-vitals.js";
import nextTs from "eslint-config-next/typescript.js";
import { defineConfig, globalIgnores } from "eslint/config";

// Each export from eslint-config-next is a single flat-config object
// (not an array), so include them directly rather than spreading.
const eslintConfig = defineConfig([
  nextVitals,
  nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
