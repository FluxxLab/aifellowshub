/**
 * Shared upload primitive used by every direct-to-Spaces upload flow
 * (lesson content, assessment-answer attachments). Each consumer
 * defines its own MIME allowlist + size cap; this file just owns the
 * byte transfer.
 *
 * Why XHR (not fetch): we need the `progress` event for the upload
 * UI bar. fetch's streaming-progress API still varies across browsers,
 * but `XMLHttpRequest.upload.onprogress` is universally supported.
 */

/**
 * PUT a File to a presigned URL the backend minted. Resolves on 2xx,
 * rejects on any non-2xx, network error, or abort. The caller passes
 * `onProgress` to drive a UI bar — the callback fires every time the
 * browser flushes more bytes upstream.
 */
export function uploadFileToSignedUrl(
  uploadUrl: string,
  file: File,
  options: { onProgress?: (loaded: number, total: number) => void } = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type);
    if (options.onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) options.onProgress?.(e.loaded, e.total);
      });
    }
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    });
    xhr.addEventListener("error", () =>
      reject(new Error("Upload network error")),
    );
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));
    xhr.send(file);
  });
}

/** Standardised shape backend signature endpoints return. */
export type SignedUploadResponse = {
  /** Presigned PUT URL the browser uploads bytes to. Expires shortly. */
  uploadUrl: string;
  /** Final public URL the browser will GET from after upload completes. */
  publicUrl: string;
  /** Object key inside the Space — useful for later cleanup. */
  objectKey: string;
};

/**
 * Allowed MIME types for assessment-answer attachments.
 * Stricter than lesson uploads (no video — assessments are typed
 * answers + supporting documents, not lecture content). Kept in
 * sync with the backend's signature endpoint allowlist.
 */
export const ANSWER_UPLOAD_ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
  "text/markdown",
] as const;

export type AnswerUploadMime = (typeof ANSWER_UPLOAD_ALLOWED_MIME)[number];

/** 25 MB — generous for slide decks & PDFs, blocks abuse. */
export const ANSWER_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

export function isAllowedAnswerMime(mime: string): mime is AnswerUploadMime {
  return (ANSWER_UPLOAD_ALLOWED_MIME as readonly string[]).includes(mime);
}
