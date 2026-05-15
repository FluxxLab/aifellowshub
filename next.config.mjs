import { withSentryConfig } from "@sentry/nextjs";
/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * `output: "standalone"` lets the Docker runner image ship only the
   * files Next actually needs (a tiny `server.js` + a minimal pruned
   * `node_modules`), keeping the image small.
   */
  output: "standalone",

  /**
   * Don't gate production builds on ESLint. We rely on TypeScript +
   * runtime tests for correctness.
   */
  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack(config) {
    // SVGR config — strip hardcoded width/height, ship a sensible default
    // className so consumers' Tailwind sizing classes always win.
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
    return config;
  },

  /**
   * Security headers + Zoom Meeting SDK cross-origin isolation.
   *
   *   1. Global rule (`/(.*)`): baseline CSP + click-jacking, MIME-sniff,
   *      referrer, permissions hardening.
   *   2. Zoom-routes rule: COOP `same-origin` + COEP `require-corp` for
   *      SharedArrayBuffer (BRD §6.4).
   */
  async headers() {
    const backendOrigin = (() => {
      // `NEXT_PUBLIC_BACKEND_URL` is the browser-visible backend host
      // (used by lesson-upload direct-POST). `BACKEND_API_URL` is the
      // server-only equivalent the BFF uses for outbound fetches —
      // both usually point at the same origin, but in dev one might
      // be the docker hostname and the other localhost. Fall back to
      // either so CSP doesn't block the browser-direct POST.
      const url =
        process.env.NEXT_PUBLIC_BACKEND_URL ??
        process.env.BACKEND_API_URL ??
        "http://localhost:4000/api";
      try {
        return new URL(url).origin;
      } catch {
        return "http://localhost:4000";
      }
    })();

    const csp = [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://source.zoom.us blob:`,
      `style-src 'self' 'unsafe-inline' https://source.zoom.us`,
      `img-src 'self' data: blob: https:`,
      `font-src 'self' data:`,
      // `*.digitaloceanspaces.com` is added so the lesson-uploads flow
      // (presigned PUT direct from the browser to DO Spaces) and the
      // playback flow (signed GET on recordings) aren't blocked by CSP
      // before the browser even attempts the CORS preflight. Without
      // this entry the upload XHR fires as `(blocked)` with 0 ms even
      // though the bucket CORS allows the origin.
      `connect-src 'self' ${backendOrigin} https://*.digitaloceanspaces.com https://challenges.cloudflare.com https://source.zoom.us https://zoom.us https://*.zoom.us wss://*.zoom.us https://*.cloudfront.net`,
      `frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://challenges.cloudflare.com https://zoom.us https://*.zoom.us`,
      `worker-src 'self' blob:`,
      `media-src 'self' blob: https://*.digitaloceanspaces.com`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
      `upgrade-insecure-requests`,
    ].join("; ");

    const baseHeaders = [
      { key: "Content-Security-Policy", value: csp },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value:
          "camera=(self), microphone=(self), geolocation=(), interest-cohort=()",
      },
    ];
    if (process.env.NODE_ENV === "production") {
      baseHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=15552000; includeSubDomains",
      });
    }

    const zoomIsolationHeaders = [
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      // `credentialless` instead of the stricter `require-corp`.
      // Both enable SharedArrayBuffer (which Zoom's SDK needs for
      // screen sharing) but `credentialless` lets Zoom's CDN
      // resources load without a Cross-Origin-Resource-Policy
      // header. Under `require-corp`, the screen-share render path
      // pulls assets that ship without CORP, the browser blocks
      // them, and viewers see the "You are viewing X's screen"
      // banner with a black canvas where the share should be.
      // Forum-confirmed fix from Zoom's own developer thread.
      // Browser support: Chrome 96+, Firefox 110+, Safari 16.4+
      // — well past our supported floor.
      { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
    ];
    const zoomIsolatedRoutes = [
      "/learning/:path*",
      "/sessions/:path*",
      "/my-sessions/:path*",
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

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "policy-innovation-centre",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
