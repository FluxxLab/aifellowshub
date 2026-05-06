// One-shot transform: convert Next 15 async params to Next 14 sync params.
//   - `params: Promise<{ ... }>`        →  `params: { ... }`
//   - `searchParams: Promise<{ ... }>`  →  `searchParams: { ... }`
//   - `await params` / `await searchParams` (standalone or in destructure)
//   - `await cookies()` / `await headers()`  →  `cookies()` / `headers()`
// Run with: node scripts/downgrade-params.mjs
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src/app", "src/lib"];
let changed = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(entry)) transform(p);
  }
}

function transform(file) {
  const src = readFileSync(file, "utf8");
  let out = src;

  // params: Promise<{ ... }>  →  params: { ... }
  out = out.replace(
    /(\b(?:params|searchParams)\s*:\s*)Promise<\s*(\{[^}]*\})\s*>/g,
    "$1$2",
  );

  // const { x } = await params  →  const { x } = params
  // const x = await searchParams  →  const x = searchParams
  out = out.replace(/await\s+(params|searchParams)\b/g, "$1");

  // await cookies() / await headers()  →  cookies() / headers()
  out = out.replace(/await\s+(cookies|headers)\(\)/g, "$1()");

  // generateMetadata / page args destructure with Promise type:
  // ({ params }: { params: Promise<{ id: string }> })
  // already covered above by the Promise<{...}> pattern.

  if (out !== src) {
    writeFileSync(file, out);
    changed++;
    console.log("changed:", file);
  }
}

for (const root of ROOTS) walk(root);
console.log(`\n${changed} files updated.`);
