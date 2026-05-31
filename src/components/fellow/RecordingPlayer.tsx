"use client";
import React, { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { apiFetch } from "@/lib/api/client";

type ProgressResponse = {
  attendance: {
    status:
      | "rsvpd"
      | "attended"
      | "attended_recording"
      | "missed";
    recordingWatchedSeconds: number;
    recordingCreditedAt: string | null;
  };
};

/**
 * Inline session-recording player with attendance crediting. Plays the
 * MP4 from a short-lived signed URL and heartbeats watched-seconds to
 * the backend so the fellow earns half-credit attendance after they've
 * watched ≥90% of the recording.
 *
 * Anti-cheat:
 *   - Watched seconds accumulates only on forward playback at ≤1.5×
 *     wall-clock speed. Seeking ahead is detected, warned, and ignored.
 *   - The cumulative counter never decreases — rewinding is fine.
 */
export default function RecordingPlayer({
  isOpen,
  onClose,
  sessionId,
  videoUrl,
  durationSeconds,
  initialWatchedSeconds = 0,
}: {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  videoUrl: string;
  durationSeconds: number | null;
  initialWatchedSeconds?: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const watchedRef = useRef(0);
  const lastTimeRef = useRef(0);
  const lastWallRef = useRef(Date.now());
  const lastSentRef = useRef(0);
  const lastWarnRef = useRef(0); // wall-clock ms of last skip warning

  const [credited, setCredited] = useState(false);
  const [watched, setWatched] = useState(0);
  const [skipCount, setSkipCount] = useState(0);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [skipModalOpen, setSkipModalOpen] = useState(false);

  // Match the backend threshold (90%).
  const fullThreshold = durationSeconds
    ? Math.floor(durationSeconds * 0.90)
    : null;

  async function postProgress(seconds: number) {
    if (seconds <= lastSentRef.current) return;
    lastSentRef.current = seconds;
    try {
      const res = await apiFetch<ProgressResponse>(
        `/sessions/${encodeURIComponent(sessionId)}/recording-progress`,
        { method: "POST", body: { secondsWatched: seconds } },
      );
      if (
        res.attendance.status === "attended_recording" &&
        res.attendance.recordingCreditedAt &&
        !credited
      ) {
        setCredited(true);
        toast.success(
          "Half-credit earned",
          "Thanks for catching up on this recording.",
        );
      }
    } catch {
      // Non-fatal — retry on next heartbeat.
    }
  }

  useEffect(() => {
    if (!isOpen) {
      const toFlush = Math.floor(watchedRef.current);
      watchedRef.current = 0;
      lastTimeRef.current = 0;
      lastWallRef.current = Date.now();
      lastSentRef.current = 0;
      lastWarnRef.current = 0;
      setCredited(false);
      setWatched(0);
      setSkipCount(0);
      setShowSkipWarning(false);
      setSkipModalOpen(false);
      if (toFlush > 0) void postProgress(toFlush);
    } else {
      const saved = initialWatchedSeconds ?? 0;
      watchedRef.current = saved;
      lastSentRef.current = saved;
      setWatched(saved);
      if (fullThreshold !== null && saved >= fullThreshold) setCredited(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const t = window.setInterval(() => {
      if (watchedRef.current > 0) {
        void postProgress(Math.floor(watchedRef.current));
      }
    }, 15_000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;
    const now = Date.now();
    const wallDelta = (now - lastWallRef.current) / 1000;
    const playDelta = v.currentTime - lastTimeRef.current;
    lastWallRef.current = now;
    lastTimeRef.current = v.currentTime;

    if (playDelta > 0 && playDelta <= wallDelta * 1.5 + 0.5) {
      watchedRef.current += playDelta;
      setWatched(watchedRef.current);
    }
  }

  function handleSeeking() {
    const v = videoRef.current;
    const now = Date.now();
    // A forward jump > 5 s counts as a skip.
    if (v && v.currentTime > lastTimeRef.current + 5) {
      setSkipCount((n) => n + 1);
      setShowSkipWarning(true);
      // Show modal at most once every 30 s; pause video so they read it.
      if (now - lastWarnRef.current > 30_000) {
        lastWarnRef.current = now;
        v.pause();
        setSkipModalOpen(true);
      }
    }
    lastWallRef.current = now;
    if (v) lastTimeRef.current = v.currentTime;
  }

  function handleEnded() {
    if (watchedRef.current > 0) {
      void postProgress(Math.floor(watchedRef.current));
    }
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
      <h3 className="mt-4 text-base font-bold text-gray-800">Skipping doesn&apos;t count</h3>
      <p className="mt-2 text-sm text-gray-500">
        Sections you skip are <strong>not</strong> credited toward your 90% watch requirement. Watch the recording continuously from start to finish to earn half-credit attendance.
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

    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-3xl p-4 sm:p-6">
      <h2 className="text-title-sm font-bold text-gray-800">
        Session recording
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Watch continuously to earn half-credit. Skipping ahead doesn&apos;t count toward your 90%.
      </p>

      {showSkipWarning && !credited && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-700">
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <span>
            <strong>Skipped sections won&apos;t be credited.</strong> Watch the full recording without skipping to earn attendance credit.
            {skipCount > 1 && ` (${skipCount} skips detected so far)`}
          </span>
        </div>
      )}

      <video
        ref={videoRef}
        src={videoUrl}
        controls
        controlsList="nodownload"
        className="mt-4 aspect-video w-full rounded-lg bg-black"
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onEnded={handleEnded}
      />

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            Watched {formatDuration(Math.floor(watched))}
            {durationSeconds && ` of ${formatDuration(durationSeconds)}`}
            {skipCount > 0 && !credited && (
              <span className="ml-2 text-warning-600">· {skipCount} skip{skipCount !== 1 ? "s" : ""}</span>
            )}
          </span>
          {fullThreshold !== null && !credited && (
            <span>
              {Math.floor(watched) >= fullThreshold
                ? "Qualifying — credit will be saved shortly"
                : `${formatDuration(Math.max(0, fullThreshold - Math.floor(watched)))} more to earn half-credit`}
            </span>
          )}
          {credited && (
            <span className="font-semibold text-success-700">
              Half-credit earned ✓
            </span>
          )}
        </div>
        {fullThreshold !== null && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-fellowship-navy transition-all"
              style={{
                width: `${Math.min(100, Math.round((watched / fullThreshold) * 100))}%`,
              }}
            />
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <Button variant="outline" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
    </>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
