/**
 * Ambient typing for Vite-style `import.meta.env` reads. The Next app
 * itself uses `process.env`, but the generated backend client module
 * reads `import.meta.env`, so TypeScript needs the shape declared.
 */
interface ImportMetaEnv {
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
