"use client";
import React, { useRef, useState } from "react";
import {
  LESSON_UPLOAD_MAX_BYTES,
  isAllowedLessonMime,
  uploadLessonContent,
  type FacultyLesson,
} from "@/lib/api/faculty";
import { toast } from "@/lib/toast";
import { FileIcon, TrashBinIcon } from "@/icons";

/**
 * Per-lesson content uploader. Renders one of three states:
 *
 *   1. Empty — "Upload content" button + drop target
 *   2. Uploading — file name + progress bar + cancel
 *   3. Attached — preview of the file with kind/size + remove button
 *
 * Uploads go directly browser → DigitalOcean Spaces using a
 * pre-signed PUT URL minted by the backend. We never proxy the bytes
 * through our own server, so the BFF / backend can stay lean even
 * when faculty are uploading 850 MB lecture videos.
 *
 * Mounting/unmounting in the middle of an upload is safe: XHR is
 * referenced via ref so the component can abort it on unmount, and
 * the `attach` PATCH is fire-and-resolve — even if the user navigates
 * away the next time they reload, the content is already attached.
 */
export default function LessonContentUpload({
  lesson,
  onChange,
}: {
  lesson: FacultyLesson;
  onChange: (next: FacultyLesson) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState<string | null>(null);

  const triggerPicker = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!isAllowedLessonMime(file.type)) {
      toast.error(
        "File type not supported",
        "Allowed: video (MP4 / WebM / MOV), PDF, or image (PNG / JPG / WebP).",
      );
      return;
    }
    if (file.size > LESSON_UPLOAD_MAX_BYTES) {
      toast.error(
        "File is too large",
        `Max upload is 850 MB. This file is ${(file.size / 1024 / 1024).toFixed(1)} MB.`,
      );
      return;
    }

    setUploading(true);
    setProgress(0);
    setFilename(file.name);
    try {
      const next = await uploadLessonContent(lesson.id, file, {
        onProgress: (loaded, total) =>
          setProgress(total === 0 ? 0 : Math.round((loaded / total) * 100)),
      });
      onChange(next);
      toast.success("Content uploaded");
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

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const removeContent = async () => {
    try {
      const res = await fetch(
        `/api/lessons/${encodeURIComponent(lesson.id)}/content`,
        { method: "DELETE", credentials: "include" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { lesson: FacultyLesson };
      onChange(data.lesson);
      toast.success("Content removed");
    } catch (err) {
      toast.errorFromException("Couldn't remove content", err);
    }
  };

  // -------- States --------

  if (uploading) {
    return (
      <div className="rounded-lg border border-dashed border-fellowship-navy/30 bg-fellowship-navy/5 px-3 py-2.5">
        <div className="flex items-center gap-3">
          <FileIcon className="h-4 w-4 shrink-0 text-fellowship-navy" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-gray-700">
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

  if (lesson.contentUrl) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-success-200 bg-success-50/50 px-3 py-2.5">
        <FileIcon className="h-4 w-4 shrink-0 text-success-700" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-gray-700">
            Attached · {formatMime(lesson.contentMimeType)}
            {lesson.contentBytes ? ` · ${formatBytes(lesson.contentBytes)}` : ""}
          </p>
          <a
            href={lesson.contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-xs text-fellowship-navy hover:underline"
          >
            View file
          </a>
        </div>
        <button
          type="button"
          onClick={triggerPicker}
          className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-white"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={removeContent}
          aria-label="Remove content"
          className="rounded-md border border-gray-200 p-1.5 text-gray-400 hover:border-error-200 hover:bg-error-50 hover:text-error-500"
        >
          <TrashBinIcon className="h-3.5 w-3.5" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,application/pdf,image/png,image/jpeg,image/webp"
          onChange={onPickerChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-3 py-2.5 transition-colors hover:border-fellowship-navy/40 hover:bg-fellowship-navy/5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          Drag a file here, or
        </p>
        <button
          type="button"
          onClick={triggerPicker}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-fellowship-navy/40 hover:text-fellowship-navy"
        >
          Choose file
        </button>
      </div>
      <p className="mt-1 text-[11px] text-gray-400">
        Video, PDF, or image · up to 850 MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,application/pdf,image/png,image/jpeg,image/webp"
        onChange={onPickerChange}
        className="hidden"
      />
    </div>
  );
}

function formatMime(mime: string | null): string {
  if (!mime) return "file";
  if (mime.startsWith("video/")) return "Video";
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/")) return "Image";
  return mime;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
