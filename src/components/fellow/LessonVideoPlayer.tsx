"use client";
import React, { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { apiFetch } from "@/lib/api/client";

/**
 * Lesson video player with skip detection.
 * Warns fellows when they seek forward > 5 s so they know skipped
 * sections haven't been watched.
 *
 * When `sessionId` is provided (the module's live session), each
 * heartbeat is also forwarded to the session's recording-progress
 * endpoint so the admin attendance RECORDING column reflects how much
 * of the uploaded lesson video the fellow has watched.
 */
type ProgressResponse = { progress: { watchedSeconds: number; completedAt: string | null } };

export default function LessonVideoPlayer({
  lessonId,
  sessionId,
  src,
  poster,
  title,
  crossOrigin,
  initialWatchedSeconds = 0,
  onComplete,
}: {
  lessonId: string;
  /** Session linked to this module. When set, watch progress is also
   *  reported to the session's recording-progress endpoint so the admin
   *  attendance RECORDING column reflects lesson-video watch time. */
  sessionId?: string | null;
  src: string;
  poster?: string;
  title?: string;
  crossOrigin?: "anonymous" | "use-credentials";
  initialWatchedSeconds?: number;
  /** Called once when the fellow first crosses the 90% threshold. */
  onComplete?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastTimeRef = useRef(0);
  const lastWallRef = useRef(Date.now());
  const lastWarnRef = useRef(0);
  const pauseAfterSeekRef = useRef(false);
  const watchedRef = useRef(initialWatchedSeconds);
  const lastSentRef = useRef(initialWatchedSeconds);
  const completedRef = useRef(false);
  const totalSecondsRef = useRef<number | null>(null);
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [skipCount, setSkipCount] = useState(0);
  const [showSkipBanner, setShowSkipBanner] = useState(false);

  async function postProgress(seconds: number) {
    if (seconds <= lastSentRef.current) return;
    lastSentRef.current = seconds;
    try {
      const res = await apiFetch<ProgressResponse>(
        `/lessons/${encodeURIComponent(lessonId)}/progress`,
        { method: "POST", body: { secondsWatched: seconds, totalSeconds: totalSecondsRef.current } },
      );
      if (res.progress.completedAt && !completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
    } catch {
      // Non-fatal — retry on next heartbeat.
    }
    // Mirror progress to the session's recording-progress endpoint so
    // the admin attendance RECORDING column reflects lesson-video watch
    // time (the uploaded video IS the session recording in this LMS).
    if (sessionId) {
      void apiFetch(
        `/sessions/${encodeURIComponent(sessionId)}/recording-progress`,
        {
          method: "POST",
          // Send the video's real duration so the backend can compute the 90%
          // credit threshold — the session row has no duration for uploaded
          // lesson-video recordings, so without this, recording catch-up
          // credit could never be earned.
          body: { secondsWatched: seconds, totalSeconds: totalSecondsRef.current },
        },
      ).catch(() => undefined);
    }
  }

  // Heartbeat every 15 s while playing.
  useEffect(() => {
    const t = window.setInterval(() => {
      if (watchedRef.current > lastSentRef.current) {
        void postProgress(Math.floor(watchedRef.current));
      }
    }, 15_000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  function handleLoadedMetadata() {
    const v = videoRef.current;
    if (v && Number.isFinite(v.duration) && v.duration > 0) {
      totalSecondsRef.current = v.duration;
    }
  }

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;
    const now = Date.now();
    const wallDelta = (now - lastWallRef.current) / 1000;
    const playDelta = v.currentTime - lastTimeRef.current;
    lastWallRef.current = now;
    lastTimeRef.current = v.currentTime;
    // Only count legitimate forward playback at ≤1.5× wall-clock speed.
    if (playDelta > 0 && playDelta <= wallDelta * 1.5 + 0.5) {
      watchedRef.current += playDelta;
    }
  }

  function handleEnded() {
    if (watchedRef.current > lastSentRef.current) {
      void postProgress(Math.floor(watchedRef.current));
    }
  }

  function handleSeeking() {
    const v = videoRef.current;
    if (!v) return;
    const now = Date.now();
    if (v.currentTime > lastTimeRef.current + 5) {
      setSkipCount((n) => n + 1);
      setShowSkipBanner(true);
      if (now - lastWarnRef.current > 30_000) {
        lastWarnRef.current = now;
        pauseAfterSeekRef.current = true;
        setSkipModalOpen(true);
      }
    }
    lastWallRef.current = now;
    lastTimeRef.current = v.currentTime;
  }

  function handleSeeked() {
    if (pauseAfterSeekRef.current) {
      videoRef.current?.pause();
      pauseAfterSeekRef.current = false;
    }
  }

  function dismissSkipModal() {
    pauseAfterSeekRef.current = false;
    setSkipModalOpen(false);
    videoRef.current?.play();
  }

  return (
    <>
      <Modal
        isOpen={skipModalOpen}
        onClose={dismissSkipModal}
        className="m-4 max-w-sm p-6 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning-50">
          <svg className="h-7 w-7 text-warning-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h3 className="mt-4 text-base font-bold text-gray-800">Skipping ahead</h3>
        <p className="mt-2 text-sm text-gray-500">
          Sections you skip are <strong>not</strong> counted as watched. Watch the lesson from start to finish to get the most out of it.
          {skipCount > 1 && ` (${skipCount} skips so far)`}
        </p>
        <Button
          variant="fellowship"
          size="sm"
          className="mt-5 w-full"
          onClick={dismissSkipModal}
        >
          OK, I&apos;ll watch without skipping
        </Button>
      </Modal>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black">
        {showSkipBanner && (
          <div className="flex items-start gap-2 bg-warning-50 px-4 py-2 text-xs text-warning-700">
            <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <span>
              <strong>Skipped sections won&apos;t be counted.</strong> Watch the full lesson for best results.
              {skipCount > 1 && ` (${skipCount} skips detected)`}
            </span>
          </div>
        )}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          controls
          crossOrigin={crossOrigin}
          preload="metadata"
          controlsList="nodownload"
          className="w-full max-h-[70vh]"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onSeeked={handleSeeked}
          onEnded={handleEnded}
        >
          {title ? <track kind="captions" /> : null}
          Your browser doesn&apos;t support inline video.{" "}
          <a href={src} className="underline">Open the file</a>.
        </video>
      </div>
    </>
  );
}
