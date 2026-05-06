import { ImageResponse } from "next/og";

/**
 * iOS home-screen / Safari pinned-tab icon. Same look as the favicon
 * but rendered larger so retina taps and "add to home screen"
 * thumbnails come out crisp.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default function AppleIcon() {
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
          fontSize: 88,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          fontFamily: "sans-serif",
          borderRadius: 32,
        }}
      >
        PIC
      </div>
    ),
    { ...size },
  );
}
