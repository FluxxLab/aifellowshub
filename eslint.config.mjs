// eslint-config-next@14 ships the legacy (eslintrc) format. ESLint 9
// uses flat config natively, so we run the legacy config through
// FlatCompat to translate `extends:` chains into flat-config blocks.
// The dirname dance is what the official ESLint migration guide
// recommends — `import.meta` doesn't expose __dirname directly in ESM.
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
