/**
 * Inline lesson content viewer.
 *
 * Renders the file at `contentUrl` directly inside the LMS — fellows
 * never get redirected to YouTube, Google Drive, or any external host.
 *
 * Dispatches on `contentMimeType` to pick the right player:
 *   - `video/*`         → HTML5 <video controls> with Range support
 *                         (Spaces serves byte ranges natively, so
 *                         seeking inside long videos works)
 *   - `application/pdf` → <iframe> using the browser's native viewer
 *   - `image/*`         → <Image> with full-width responsive sizing
 *   - anything else     → "Download file" link as a graceful fallback
 *
 * If `contentUrl` is null, renders an explicit empty-state so it's
 * obvious to the fellow that nothing's been published yet (avoids
 * the "is it loading?" confusion).
 */
import Image from "next/image";

type Props = {
  contentUrl: string | null;
  contentMimeType: string | null;
  /** Used as poster fallback / `<video>` poster image hint when set. */
  posterUrl?: string | null;
  title?: string;
};

export default function LessonContent({
  contentUrl,
  contentMimeType,
  posterUrl,
  title,
}: Props) {
  if (!contentUrl) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-sm font-medium text-gray-600">
          Lesson content not yet uploaded
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Your faculty hasn&apos;t attached the file for this lesson yet.
          Check back shortly.
        </p>
      </div>
    );
  }

  const mime = contentMimeType ?? "";

  if (mime.startsWith("video/")) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black">
        <video
          src={contentUrl}
          poster={posterUrl ?? undefined}
          controls
          // `preload="metadata"` fetches duration + first frame only —
          // saves bandwidth for fellows who scroll past the lesson
          // without playing it. Range requests fill in the rest.
          preload="metadata"
          // `controlsList="nodownload"` is a hint, not enforcement —
          // any fellow can capture the URL from devtools. Real DRM
          // would require a different storage backend (Mux, etc.).
          // We lean on the audit log + RLS-style backend gating
          // for misuse signals.
          controlsList="nodownload"
          className="w-full max-h-[70vh]"
        >
          {title ? <track kind="captions" /> : null}
          Your browser doesn&apos;t support inline video. {" "}
          <a href={contentUrl} className="underline">
            Open the file
          </a>
          .
        </video>
      </div>
    );
  }

  if (mime === "application/pdf") {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <iframe
          src={contentUrl}
          title={title ?? "Lesson PDF"}
          className="block h-[70vh] w-full"
        />
      </div>
    );
  }

  if (mime.startsWith("image/")) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <Image
          src={contentUrl}
          alt={title ?? "Lesson image"}
          width={1200}
          height={800}
          className="h-auto w-full"
          // The image is on a third-party host (Spaces CDN). Next's
          // image optimisation is opt-in for remote URLs via
          // `images.remotePatterns`; we don't add the Spaces domain
          // there so this falls back to direct serving — fine for
          // PNG/JPG lesson illustrations.
          unoptimized
        />
      </div>
    );
  }

  // Unknown/unsupported MIME — fall back to a download link rather
  // than rendering a broken player.
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <p className="text-sm text-gray-700">
        This lesson content is in a format the LMS can&apos;t embed directly.
      </p>
      <a
        href={contentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-fellowship-navy hover:underline"
      >
        Open the file
      </a>
    </div>
  );
}
