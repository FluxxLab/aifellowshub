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
      const url = process.env.BACKEND_API_URL ?? "http://localhost:4000/api";
      try {
        return new URL(url).origin;
      } catch {
        return "http://localhost:4000";
      }
    })();

    const csp = [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://source.zoom.us`,
      `style-src 'self' 'unsafe-inline' https://source.zoom.us`,
      `img-src 'self' data: blob: https:`,
      `font-src 'self' data:`,
      `connect-src 'self' ${backendOrigin} https://challenges.cloudflare.com https://source.zoom.us https://zoom.us https://*.zoom.us wss://*.zoom.us`,
      `frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://challenges.cloudflare.com https://zoom.us https://*.zoom.us`,
      `worker-src 'self' blob:`,
      `media-src 'self' blob:`,
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
      { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
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

export default nextConfig;
