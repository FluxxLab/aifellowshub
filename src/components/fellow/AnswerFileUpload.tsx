"use client";
import React, { useRef, useState } from "react";
import { FileIcon, TrashBinIcon } from "@/icons";
import { toast } from "@/lib/toast";
import {
  ANSWER_UPLOAD_ALLOWED_MIME,
  ANSWER_UPLOAD_MAX_BYTES,
  isAllowedAnswerMime,
  uploadAnswerFile,
  type UploadedAnswerFile,
} from "@/lib/api/fellow-assessment";

/**
 * Per-question file picker for `attachment` assessment questions.
 *
 * The fellow picks a file → it uploads to scratch storage immediately
 * (browser → DigitalOcean Spaces via presigned PUT) → the resulting
 * URL + metadata get stored in the AssessmentTaker's in-memory answer
 * state. On Submit, the AssessmentTaker forwards the metadata in the
 * usual submit body; the backend persists it on the new answer row.
 *
 * States:
 *   1. Empty       — drop zone + "Choose file" button
 *   2. Uploading   — filename + progress bar (no abort yet — XHR
 *                    abort is wired in `uploadFileToSignedUrl` via
 *                    cancellation but not exposed here. Future
 *                    addition if 25 MB uploads start frustrating
 *                    fellows on flaky connections.)
 *   3. Uploaded    — confirmation + replace / remove
 */
export default function AnswerFileUpload({
  current,
  disabled,
  onChange,
}: {
  /** Current answer's uploaded file (null = nothing yet). */
  current: UploadedAnswerFile | null;
  /** Submission has started OR attempt is locked — disable the picker. */
  disabled?: boolean;
  /** Called with the upload result (or null on remove). */
  onChange: (next: UploadedAnswerFile | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState<string | null>(null);

  const triggerPicker = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!isAllowedAnswerMime(file.type)) {
      toast.error(
        "File type not supported",
        "Allowed: PDF, Word, PowerPoint, image, or plain text.",
      );
      return;
    }
    if (file.size > ANSWER_UPLOAD_MAX_BYTES) {
      toast.error(
        "File is too large",
        `Max upload is ${ANSWER_UPLOAD_MAX_BYTES / 1024 / 1024} MB. This file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      );
      return;
    }
    setUploading(true);
    setProgress(0);
    setFilename(file.name);
    try {
      const uploaded = await uploadAnswerFile(file, {
        onProgress: (loaded, total) =>
          setProgress(total === 0 ? 0 : Math.round((loaded / total) * 100)),
      });
      onChange(uploaded);
      toast.success("File attached");
    } catch (err) {
      toast.errorFromException("Upload failed", err);
    } finally {
      setUploading(false);
      setProgress(0);
      setFilename(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const removeFile = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // -------- States --------

  if (uploading) {
    return (
      <div className="rounded-lg border border-dashed border-fellowship-navy/30 bg-fellowship-navy/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <FileIcon className="h-4 w-4 shrink-0 text-fellowship-navy" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-700">
              {filename}
            </p>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-fellowship-navy/10">
              <div
                className="h-full bg-fellowship-navy transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-gray-500">
            {progress}%
          </span>
        </div>
      </div>
    );
  }

  if (current) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success-200 bg-success-50/50 px-4 py-3">
        <FileIcon className="h-4 w-4 shrink-0 text-success-700" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-800">
            {current.fileName}
          </p>
          <p className="text-xs text-gray-500">
            {formatMime(current.fileMimeType)} · {formatBytes(current.fileBytes)}
          </p>
        </div>
        <button
          type="button"
          onClick={triggerPicker}
          disabled={disabled}
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={removeFile}
          disabled={disabled}
          aria-label="Remove file"
          className="rounded-md border border-gray-200 p-1.5 text-gray-400 hover:border-error-200 hover:bg-error-50 hover:text-error-500 disabled:opacity-50"
        >
          <TrashBinIcon className="h-3.5 w-3.5" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ANSWER_UPLOAD_ALLOWED_MIME.join(",")}
          onChange={onPickerChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <label
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center text-sm transition-colors ${
        disabled
          ? "cursor-not-allowed border-gray-200 text-gray-400 opacity-60"
          : "cursor-pointer border-gray-300 text-gray-500 hover:border-fellowship-navy hover:bg-gray-50"
      }`}
    >
      <FileIcon className="h-6 w-6" />
      <span className="font-medium">Choose a file to upload</span>
      <span className="text-xs text-gray-400">
        PDF, Word, PowerPoint, image, or text — up to{" "}
        {ANSWER_UPLOAD_MAX_BYTES / 1024 / 1024} MB
      </span>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={ANSWER_UPLOAD_ALLOWED_MIME.join(",")}
        disabled={disabled}
        onChange={onPickerChange}
      />
    </label>
  );
}

function formatMime(mime: string | null): string {
  if (!mime) return "file";
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/")) return "Image";
  if (mime.includes("word")) return "Word doc";
  if (mime.includes("presentation")) return "Slide deck";
  if (mime.startsWith("text/")) return "Text";
  return mime;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
