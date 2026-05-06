import { ImageResponse } from "next/og";

/**
 * Browser-tab favicon. Generated dynamically by Next.js's app-router
 * icon convention so we don't have to ship an .ico file — Next emits
 * the right responses for /icon, /icon.png, etc.
 *
 * Brand: fellowship-navy background, white "PIC" wordmark. The full
 * composite logo (with the yellow Africa swirl + AHFID lockup) is too
 * busy at 32×32 — a clean monogram reads better in the tab strip.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";
// Opt out of static prerendering — Next 14's @vercel/og bundle hits an
// `Invalid URL` in fileURLToPath during build-time generation. Rendering
// at request time avoids the bug; the response is cached by the CDN.
export const dynamic = "force-dynamic";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#002d74",
          color: "#ffffff",
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          fontFamily: "sans-serif",
          // Slight border-radius so the icon reads as a "tile" in the
          // address bar / tab strip rather than a hard square.
          borderRadius: 6,
        }}
      >
        PIC
      </div>
    ),
    { ...size },
  );
}
