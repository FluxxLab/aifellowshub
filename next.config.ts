import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  /**
   * `output: "standalone"` lets the Docker runner image ship only the
   * files Next actually needs (a tiny `server.js` + a minimal pruned
   * `node_modules`), keeping the image small. See
   * https://nextjs.org/docs/app/api-reference/next-config-js/output
   */
  output: "standalone",

  /**
   * Force Next to transpile the Zoom Meeting SDK in the same compilation
   * pass as application code. Without this, the pre-bundled SDK chunk
   * carries its own React reference and crashes with
   *   "Cannot read properties of undefined (reading 'ReactCurrentOwner')"
   * because its baked React doesn't match the React singleton Next ships
   * to client components. Transpiling forces SDK + app to share one React.
   */
  transpilePackages: ["@zoom/meetingsdk"],

  /**
   * Don't gate production builds on ESLint. We rely on TypeScript +
   * runtime tests for correctness; Next 15.5 ships some experimental
   * React Compiler rules (e.g. `react-hooks/set-state-in-effect`)
   * that fire on legitimate patterns we use elsewhere. Linting still
   * runs in editors and via `pnpm lint` for review — it just doesn't
   * block deploys.
   */
  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack(config) {
    // SVGR config:
    //   - `dimensions: false` strips the SVG's hardcoded `width`/`height`
    //     attributes so consumers' Tailwind sizing classes always win.
    //     Without this, presentation attributes occasionally beat
    //     class-based sizing in Tailwind 4 + Turbopack output.
    //   - `svgProps.className: "h-5 w-5"` sets a sensible 20px default
    //     for consumers that don't pass a className (e.g. <Button
    //     startIcon={<PlusIcon />}>). Consumer-passed className overrides
    //     this because it's spread last.
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            dimensions: false,
            svgProps: { className: "h-5 w-5" },
          },
        },
      ],
    });

    // Force every `import 'react'` / `import 'react-dom'` — including
    // the ones inside the bundled Zoom Meeting SDK chunk — to resolve
    // to this repo's installed copy. Without this alias, Next.js can
    // surface its own compiled React (which is React 19) to dependent
    // chunks, and the Zoom SDK's `React.__SECRET_INTERNALS_DO_NOT_USE_
    // OR_YOU_WILL_BE_FIRED.ReactCurrentOwner` access blows up because
    // React 19 renamed those internals. Pinning the singleton fixes it.
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      react: path.resolve(process.cwd(), "node_modules/react"),
      "react-dom": path.resolve(process.cwd(), "node_modules/react-dom"),
    };

    return config;
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: [
          {
            loader: "@svgr/webpack",
            options: {
              dimensions: false,
              svgProps: { className: "h-5 w-5" },
            },
          },
        ],
        as: "*.js",
      },
    },
  },

  /**
   * Security headers.
   *
   * Two rules:
   *   1. **Global rule (`/(.*)`):** baseline CSP + click-jacking,
   *      MIME-sniff, referrer, and permissions hardening. Applies to
   *      every response.
   *   2. **`/learning/:path*` rule:** cross-origin isolation for the
   *      Zoom Meeting SDK (BRD §6.4) — `SharedArrayBuffer` requires
   *      COOP `same-origin` + COEP `require-corp`. Scoped narrowly so
   *      pages that load cross-origin avatars/fonts aren't broken.
   *
   * CSP rationale:
   *   - `'unsafe-inline'` on `style-src` is needed because Next inlines
   *     critical CSS during SSR. Removing it would require a nonce
   *     pipeline through every server render.
   *   - `'unsafe-inline'` on `script-src` is the same Next-SSR
   *     constraint. Tightening to nonces is a future hardening step.
   *   - `connect-src` includes the backend (for browser-initiated
   *     fetches) and the Anthropic / Cloudflare endpoints we use.
   *   - `frame-src` allows YouTube embeds (used in lesson media) and
   *     Zoom (live sessions). Add others as needed.
   *   - `frame-ancestors 'none'` is the modern click-jacking defence —
   *     equivalent to `X-Frame-Options: DENY` and supersedes it on
   *     browsers that support CSP level 2.
   */
  async headers() {
    const backendOrigin = (() => {
      const url = process.env.BACKEND_API_URL ?? "http://localhost:4000/api";
      try {
        return new URL(url).origin;
      } catch {
        return "http://localhost:4000";
      }
    })();

    const csp = [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src 'self' data: blob: https:`,
      `font-src 'self' data:`,
      `connect-src 'self' ${backendOrigin} https://challenges.cloudflare.com`,
      `frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://challenges.cloudflare.com https://*.zoom.us`,
      `worker-src 'self' blob:`,
      `media-src 'self' blob:`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
      `upgrade-insecure-requests`,
    ].join("; ");

    // HSTS is only safe in production. In dev (especially behind a
    // local HTTPS cert via mkcert / Caddy) a 2-year `max-age` would
    // pin the dev origin to HTTPS-only and survive long after the
    // cert is gone. We also intentionally omit `preload` — getting
    // a domain off the preload list takes weeks, so opt in explicitly
    // by adding it here once you're sure.
    const baseHeaders = [
      { key: "Content-Security-Policy", value: csp },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(self), microphone=(self), geolocation=(), interest-cohort=()",
      },
    ];
    if (process.env.NODE_ENV === "production") {
      baseHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=15552000; includeSubDomains",
      });
    }

    // Routes that embed the Zoom Meeting SDK Component View. The SDK
    // needs cross-origin isolation (COOP `same-origin` + COEP
    // `require-corp`) for SharedArrayBuffer; without it, recent SDK
    // versions crash the renderer and Chrome shows "This page couldn't
    // load". Keep this list in sync with every route that mounts
    // <ZoomMeetingRoom> directly or indirectly.
    const zoomIsolationHeaders = [
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
    ];
    const zoomIsolatedRoutes = [
      "/learning/:path*", // fellow learning pages (LiveSessionAction)
      "/sessions/:path*", // admin session detail (SessionDetailHeader)
      "/my-sessions/:path*", // fellow sessions list (future embed)
    ];

    return [
      {
        source: "/(.*)",
        headers: baseHeaders,
      },
      ...zoomIsolatedRoutes.map((source) => ({
        source,
        headers: zoomIsolationHeaders,
      })),
    ];
  },
};

export default nextConfig;
