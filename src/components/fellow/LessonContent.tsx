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
import LessonVideoPlayer from "@/components/fellow/LessonVideoPlayer";

type Props = {
  lessonId: string;
  /** Passed through to LessonVideoPlayer so watch progress is also
   *  reported to the session's recording-progress endpoint. */
  sessionId?: string | null;
  contentUrl: string | null;
  contentMimeType: string | null;
  posterUrl?: string | null;
  title?: string;
  initialWatchedSeconds?: number;
  onComplete?: () => void;
};

export default function LessonContent({
  lessonId,
  sessionId,
  contentUrl,
  contentMimeType,
  posterUrl,
  title,
  initialWatchedSeconds,
  onComplete,
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
      <LessonVideoPlayer
        lessonId={lessonId}
        sessionId={sessionId}
        src={contentUrl}
        poster={posterUrl ?? undefined}
        title={title}
        crossOrigin="anonymous"
        initialWatchedSeconds={initialWatchedSeconds}
        onComplete={onComplete}
      />
    );
  }

  if (mime === "application/pdf") {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <iframe
          src={contentUrl}
          title={title ?? "Lesson PDF"}
          className="block h-[50vh] w-full sm:h-[60vh] md:h-[70vh]"
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
          // Same COEP `require-corp` rule that affects <video>: the
          // page is cross-origin isolated for Zoom's SharedArrayBuffer,
          // so cross-origin images need the CORS fetch path. Spaces
          // CORS already permits GET from this origin.
          crossOrigin="anonymous"
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
