"use client";
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";

/** Mirrors the fellow's own upload: PDF only, 50 MB. */
const ALLOWED_TYPES = ["application/pdf"];
const MAX_BYTES = 50 * 1024 * 1024;

/**
 * Admin uploads a fellow's capstone document on their behalf.
 *
 * Fellows sometimes can't upload their own final documentation — a failed
 * browser upload, a file mailed to the programme team, or an account they've
 * lost access to. Certification keys on that document existing, so without
 * this the programme team has no way to unblock them.
 *
 * Same two-step flow as the fellow's upload: presign, PUT straight to storage,
 * then record the URL against the capstone.
 */
export default function AdminCapstoneUpload({
  capstoneId,
  fellowName,
  hasDocument,
}: {
  capstoneId: string;
  fellowName: string;
  /** Drives the label — replacing a document is a different act from adding one. */
  hasDocument: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(
        "Please upload a PDF",
        "Only PDF files are accepted, matching what fellows can upload.",
      );
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File too large", "Maximum size is 50 MB.");
      return;
    }

    setBusy(true);
    setProgress(0);
    try {
      const { uploadUrl, publicUrl } = await apiFetch<{
        uploadUrl: string;
        publicUrl: string;
      }>(`/capstones/${encodeURIComponent(capstoneId)}/upload-url`, {
        method: "POST",
        body: { mimeType: file.type, bytes: file.size, filename: file.name },
      });
      // Never PUT without somewhere to record the result — otherwise the file
      // reaches storage and the capstone is never updated, which reads to
      // everyone as a successful upload that vanished.
      if (!uploadUrl || !publicUrl) {
        throw new Error("The server didn't return a storage URL. Nothing was saved.");
      }

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable)
            setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () =>
          xhr.status >= 200 && xhr.status < 300
            ? resolve()
            : reject(new Error(`Upload failed (${xhr.status})`));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      await apiFetch(`/capstones/${encodeURIComponent(capstoneId)}/artifact`, {
        method: "POST",
        body: { artifactUrl: publicUrl },
      });

      toast.success(
        "Document uploaded",
        `${file.name} is now attached to ${fellowName}'s capstone. They've been notified.`,
      );
      router.refresh();
    } catch (err) {
      toast.errorFromException("Upload failed", err);
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title={`Upload a capstone document on ${fellowName}'s behalf`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        {busy
          ? `Uploading… ${progress}%`
          : hasDocument
            ? "Replace document"
            : "Upload for fellow"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        onChange={onPick}
      />
    </>
  );
}
