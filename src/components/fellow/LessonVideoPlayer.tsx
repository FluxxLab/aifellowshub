"use client";
import React, { useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

/**
 * Lesson video player with skip detection.
 * Warns fellows when they seek forward > 5 s so they know skipped
 * sections haven't been watched. No credit tracking here — that lives
 * in RecordingPlayer for session recordings.
 */
export default function LessonVideoPlayer({
  src,
  poster,
  title,
  crossOrigin,
}: {
  src: string;
  poster?: string;
  title?: string;
  crossOrigin?: "anonymous" | "use-credentials";
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastTimeRef = useRef(0);
  const lastWarnRef = useRef(0);
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [skipCount, setSkipCount] = useState(0);
  const [showSkipBanner, setShowSkipBanner] = useState(false);

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (v) lastTimeRef.current = v.currentTime;
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
        v.pause();
        setSkipModalOpen(true);
      }
    }
    lastTimeRef.current = v.currentTime;
  }

  function dismissSkipModal() {
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
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
        >
          {title ? <track kind="captions" /> : null}
          Your browser doesn&apos;t support inline video.{" "}
          <a href={src} className="underline">Open the file</a>.
        </video>
      </div>
    </>
  );
}
