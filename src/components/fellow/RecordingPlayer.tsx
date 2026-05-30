"use client";
import React, { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";

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
 * watched ≥50% of the recording.
 *
 * Anti-cheat:
 *   - Watched seconds is accumulated only when the playhead actually
 *     moves forward at ≤1.5× wall-clock time (so seeking ahead doesn't
 *     count, and a paused tab in the background doesn't earn credit).
 *   - The cumulative counter is never decreased — rewinding is fine,
 *     credit doesn't double up.
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
  const watchedRef = useRef(0); // accumulated seconds (anti-cheat)
  const lastTimeRef = useRef(0); // playhead position at last tick
  const lastWallRef = useRef(Date.now()); // real time at last tick
  const lastSentRef = useRef(0); // most recent value posted to backend

  const [credited, setCredited] = useState(false);
  const [watched, setWatched] = useState(0);

  // Match the backend threshold (90%) so the progress bar reflects the real requirement.
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
      // Heartbeat failure is non-fatal — try again on the next tick.
    }
  }

  useEffect(() => {
    if (!isOpen) {
      // Flush any progress not yet sent before resetting. Handles the
      // case where the fellow watched to 90%+ then clicked Close before
      // the 15s heartbeat or the video's ended event fired.
      const toFlush = Math.floor(watchedRef.current);
      watchedRef.current = 0;
      lastTimeRef.current = 0;
      lastWallRef.current = Date.now();
      lastSentRef.current = 0; // reset first so postProgress check passes
      setCredited(false);
      setWatched(0);
      if (toFlush > 0) void postProgress(toFlush);
    } else {
      // Seed from server-saved progress so the bar shows cumulative state.
      const saved = initialWatchedSeconds ?? 0;
      watchedRef.current = saved;
      lastSentRef.current = saved;
      setWatched(saved);
      if (fullThreshold !== null && saved >= fullThreshold) setCredited(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Periodic heartbeat — sends the latest watched count every 15s
  // while the modal is open. Avoids spam from per-frame timeupdate.
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

    // Only credit forward playback at ≤1.5× speed. Skips, jumps, and
    // background playback that runs faster than wall time get ignored.
    if (playDelta > 0 && playDelta <= wallDelta * 1.5 + 0.5) {
      watchedRef.current += playDelta;
      setWatched(watchedRef.current);
    }
  }

  function handleSeeking() {
    // Reset the wall clock so the next timeupdate doesn't get a
    // monstrous wallDelta after a long pause.
    lastWallRef.current = Date.now();
    if (videoRef.current) lastTimeRef.current = videoRef.current.currentTime;
  }

  function handleEnded() {
    if (watchedRef.current > 0) {
      void postProgress(Math.floor(watchedRef.current));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-3xl p-4 sm:p-6">
      <h2 className="text-title-sm font-bold text-gray-800">
        Session recording
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Watch the full recording to earn half-credit attendance for this
        session. Skipping ahead doesn&apos;t count.
      </p>

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
            {durationSeconds &&
              ` of ${formatDuration(durationSeconds)}`}
          </span>
          {fullThreshold !== null && !credited && (
            <span>
              Watch {formatDuration(Math.max(0, fullThreshold - Math.floor(watched)))} more to earn half-credit
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
                width: `${Math.min(
                  100,
                  Math.round((watched / fullThreshold) * 100),
                )}%`,
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
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
