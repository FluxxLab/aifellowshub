"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { toast } from "@/lib/toast";
import { CheckLineIcon, PaperPlaneIcon } from "@/icons";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import {
  getCapstoneUploadUrl,
  postFellowCapstoneComment,
  saveFellowCapstone,
  submitFellowCapstone,
  type CapstoneFeedbackEntry,
  type CapstoneMilestone,
  type CapstoneStatus,
  type FellowCapstone,
  type SaveCapstonePayload,
} from "@/lib/api/fellow-capstone";
import { parseCapstoneDocument } from "@/lib/capstone/parseCapstoneDocument";
import {
  capstoneFilenameBase,
  downloadCapstoneDocx,
} from "@/lib/capstone/exportCapstoneDocx";

/**
 * Max characters for the problem statement. Must stay in step with the
 * server's `UpsertCapstoneDto` cap  if the client lets a fellow exceed it,
 * the save is rejected outright and the draft (plus any PDF attached in the
 * same request) is lost.
 */
const PROBLEM_MAX = 20_000;

/**
 * Fellow capstone view (BRD §6.10).
 *
 * Phase 1 (UI-first): the draft form is editable client-side; "Save draft"
 * just bumps a local lastSaved timestamp.
 * Phase 2: PATCH /capstone/me on save, POST /capstone/me/submit on submit,
 * POST /capstone/me/feedback on a thread reply.
 */
export default function MyCapstoneView({
  capstone,
}: {
  capstone: FellowCapstone;
}) {
  const user = useCurrentUser();
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [title, setTitle] = useState(capstone.title);
  const [draft, setDraft] = useState(capstone.draft);
  const [lastSaved, setLastSaved] = useState(capstone.draft.lastSavedAt);
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">("idle");
  const [submitState, setSubmitState] = useState<"idle" | "submitting">("idle");
  const [status, setStatus] = useState<CapstoneStatus>(capstone.status);
  const [feedback, setFeedback] = useState(capstone.feedback);
  const [reply, setReply] = useState("");
  const [artifactUrl, setArtifactUrl] = useState<string | null>(capstone.artifactUrl);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [exporting, setExporting] = useState(false);

  const ALLOWED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];

  /**
   * Best-effort: read the uploaded document's contents back into any EMPTY
   * boxes so the fellow doesn't re-type what's already in the file. Only fills
   * blanks — it never overwrites text they've already entered — and any parse
   * failure is swallowed so it can never block the upload itself. Parsing runs
   * entirely in the browser (see parseCapstoneDocument).
   */
  async function importFromDocument(file: File) {
    try {
      const parsed = await parseCapstoneDocument(file);

      // Legacy binary .doc — can't be read in the browser. Tell the fellow how
      // to get auto-fill instead of leaving them wondering why nothing happened.
      if (parsed.source === "unsupported") {
        toast.info(
          "Can't auto-read a .doc file",
          "Your document is attached. To auto-fill the boxes, re-save it as .docx (Word: File → Save As → Word Document) or upload a PDF.",
        );
        return;
      }

      const next = { ...draft };
      let filledSections = 0;
      const fillIfEmpty = (
        key: "problem" | "approach" | "deliverables" | "risks",
        value?: string,
      ): boolean => {
        if (value && !next[key].trim()) {
          next[key] = value;
          filledSections += 1;
          return true;
        }
        return false;
      };

      // Map the recognised sections (a .docx exported from our template).
      fillIfEmpty("problem", parsed.fields.problem);
      fillIfEmpty("approach", parsed.fields.approach);
      fillIfEmpty("deliverables", parsed.fields.deliverables);
      fillIfEmpty("risks", parsed.fields.risks);
      if (parsed.fields.title && !title.trim()) setTitle(parsed.fields.title);

      // Fallback: nothing mapped (a PDF, or a Word doc that isn't our
      // template) but we did extract text — drop the whole thing into the
      // Problem statement box so the fellow still gets their words back and
      // can split them across the sections.
      let usedFallback = false;
      if (filledSections === 0 && parsed.rawText) {
        usedFallback = fillIfEmpty("problem", parsed.rawText);
      }

      if (usedFallback) {
        setDraft(next);
        toast.success(
          "Imported from your document",
          "Added the text to the Problem statement box — move it into the right sections, then Save.",
        );
      } else if (filledSections > 0) {
        setDraft(next);
        toast.success(
          "Imported from your document",
          `Filled ${filledSections} section${filledSections === 1 ? "" : "s"} from your file. Review the text, then Save.`,
        );
      } else if (!parsed.rawText) {
        // Truly nothing extractable (empty or unreadable file).
        toast.info(
          "Couldn't read the document",
          "Your file is attached. Type or paste your content into the boxes, then Save.",
        );
      }
      // else: text was found but every box already had content — leave the
      // fellow's own writing untouched and stay silent.
    } catch (err) {
      // Parsing is a convenience and must never block the upload, but tell the
      // fellow it didn't happen (and log it) rather than failing silently.
      console.error("[capstone] document parse failed", err);
      toast.info(
        "Couldn't read the document automatically",
        "Your file is attached. Type or paste your content into the boxes, then Save.",
      );
    }
  }

  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Unsupported format", "Please upload a Word (.docx) or PDF file.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("File too large", "Maximum size is 50 MB.");
      return;
    }
    // The attach is recorded by saving the capstone (artifactUrl travels with
    // problemStatement), so an over-length draft would upload the file to
    // storage and then fail to record it  the file would appear to vanish.
    // Block it here with an actionable message instead.
    if (draft.problem.length > PROBLEM_MAX) {
      toast.error(
        "Shorten your problem statement first",
        `It's ${draft.problem.length.toLocaleString()} characters (limit ${PROBLEM_MAX.toLocaleString()}). The upload can't be recorded until it fits.`,
      );
      return;
    }
    // Read the document into any empty boxes BEFORE uploading, so the content
    // is recovered even if the upload itself fails. Best-effort and non-blocking.
    await importFromDocument(file);

    setUploadState("uploading");
    setUploadProgress(0);
    try {
      const { uploadUrl, objectUrl } = await getCapstoneUploadUrl({
        mimeType: file.type,
        bytes: file.size,
        filename: file.name,
      });
      // Upload directly to Spaces via the presigned PUT URL.
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
      // Persist the URL on the capstone row. This is a partial save: it
      // carries the uploaded document, plus the typed title/problem statement
      // ONLY when they're valid — an empty or too-short problem statement is
      // omitted (the fellow may have put it inside the document), so attaching
      // never fails validation. Omitted fields keep their stored value.
      const attach: SaveCapstonePayload = { artifactUrl: objectUrl };
      if (title.trim().length >= 2) attach.title = title.trim();
      if (draft.problem.trim().length >= 10) attach.problemStatement = draft.problem;
      await saveFellowCapstone(attach);
      setArtifactUrl(objectUrl);
      setUploadState("done");
      toast.success("Document uploaded", file.name);
    } catch (err) {
      setUploadState("idle");
      toast.errorFromException("Upload failed", err);
    }
  }

  const wordCount = countWords([
    draft.problem,
    draft.approach,
    draft.deliverables,
    draft.risks,
  ].join(" "));

  const onSaveDraft = async () => {
    if (savingState === "saving") return;
    // Editing is blocked server-side once a capstone is under review, so
    // saving would 403 and quietly lose whatever was typed. Say so up front.
    if (status === "under-review" || status === "approved") {
      toast.error(
        "Editing is locked",
        status === "approved"
          ? "This capstone has been approved, so it can no longer be edited."
          : "Your capstone is with your mentor. You can edit again once they respond.",
      );
      return;
    }
    // Catch over-length drafts before the request so the fellow gets an
    // actionable message instead of a rejected save (which used to drop the
    // whole draft, and any PDF attached in the same payload).
    if (draft.problem.length > PROBLEM_MAX) {
      toast.error(
        "Problem statement is too long",
        `It's ${draft.problem.length.toLocaleString()} characters  the limit is ${PROBLEM_MAX.toLocaleString()}. Shorten it, then save.`,
      );
      return;
    }
    setSavingState("saving");
    try {
      const saved = await saveFellowCapstone({
        title: title.trim() || capstone.title,
        problemStatement: draft.problem,
        // Backend stores everything except the problem statement as one
        // markdown blob in `content` for now. Concat the structured fields
        // so the mentor sees the full draft.
        content: [
          draft.approach && `## Approach\n${draft.approach}`,
          draft.deliverables && `## Deliverables\n${draft.deliverables}`,
          draft.risks && `## Risks & limitations\n${draft.risks}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
        sector: capstone.sector,
      });
      setLastSaved(saved.updatedAt);
      setStatus(saved.status);
      setSavingState("saved");
      window.setTimeout(() => setSavingState("idle"), 1800);
    } catch (err) {
      setSavingState("idle");
      toast.errorFromException("Couldn't save", err);
    }
  };

  /**
   * Download the capstone as a real Word (.docx) file. Two modes, driven by
   * whether the fellow has uploaded their actual capstone document yet:
   *
   *   - "template" (default, nothing uploaded): a scaffold — the section
   *     headings with the same guidance prompts shown on screen — so the fellow
   *     has a correctly-structured document to fill in offline and upload.
   *   - "copy" (after a successful upload): framed as an offline backup they
   *     can keep editing or email.
   *
   * Either way a section the fellow has already written into is exported with
   * their text; only empty sections fall back to the italic guidance prompt.
   * Deliberately independent of the LMS save so a draft can never be stranded
   * with no way to get it out even if the save is failing.
   */
  const downloadDocx = async (mode: "template" | "copy") => {
    if (exporting) return;
    setExporting(true);
    try {
      const displayTitle = title.trim() || capstone.title;
      // Written sections export as-is; empty ones fall back to the on-screen
      // guidance prompt (`hint`) in grey italics so the fellow always knows
      // what belongs where. Shared with the mentor export via downloadCapstoneDocx.
      await downloadCapstoneDocx({
        title: displayTitle,
        subtitle:
          mode === "template"
            ? `${capstone.sector} · Capstone template`
            : `${capstone.sector} · Draft exported ${new Date().toLocaleDateString(undefined, { timeZone: "Africa/Lagos" })}`,
        sections: [
          {
            label: "Problem statement",
            text: draft.problem,
            hint: "What is the harm or governance gap, and why does it matter?",
          },
          {
            label: "Approach",
            text: draft.approach,
            hint: "How will you address it? Method, framework, deliverable type.",
          },
          {
            label: "Deliverables",
            text: draft.deliverables,
            hint: "Concrete artefacts — what will exist by Week 12?",
          },
          {
            label: "Risks & limitations",
            text: draft.risks,
            hint: "What could go wrong, and what's out of scope.",
          },
        ],
        filename: `${capstoneFilenameBase(displayTitle)}_Capstone_${mode === "template" ? "Template" : "Draft"}.docx`,
      });
      toast.success(
        mode === "template" ? "Template downloaded" : "Draft downloaded",
        mode === "template"
          ? "Fill it in, then upload it above."
          : "A Word copy has been saved to your device.",
      );
    } catch (err) {
      toast.errorFromException(
        mode === "template" ? "Couldn't download template" : "Couldn't download draft",
        err,
      );
    } finally {
      setExporting(false);
    }
  };

  const onSubmit = async () => {
    if (submitState === "submitting") return;
    if (draft.problem.trim().length < 10) {
      toast.error(
        "Add a problem statement",
        "Mentors need at least a brief framing before reviewing.",
      );
      return;
    }
    const ok = await confirm({
      title: "Submit for mentor review?",
      message:
        "Your mentor will receive the current draft. You can keep editing once they reply.",
      confirmLabel: "Submit",
    });
    if (!ok) return;
    setSubmitState("submitting");
    try {
      // Save first so the latest draft is what the mentor sees.
      await saveFellowCapstone({
        title: title.trim() || capstone.title,
        problemStatement: draft.problem,
        content: [
          draft.approach && `## Approach\n${draft.approach}`,
          draft.deliverables && `## Deliverables\n${draft.deliverables}`,
          draft.risks && `## Risks & limitations\n${draft.risks}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
        sector: capstone.sector,
      });
      const submitted = await submitFellowCapstone();
      setStatus(submitted.status);
      setLastSaved(submitted.updatedAt);
      toast.success(
        "Submitted",
        "Your mentor has the latest draft. Status will update once they review.",
      );
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't submit", err);
    }
    setSubmitState("idle");
  };

  const onPostReply = async () => {
    const trimmed = reply.trim();
    if (!trimmed) return;
    // Optimistically render the message so the thread feels instant.
    // The id has an "opt-" prefix so router.refresh() below can replace
    // it with the persisted row's real id without leaving a duplicate.
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: CapstoneFeedbackEntry = {
      id: optimisticId,
      fromMentor: false,
      fromName: user.fullName,
      message: trimmed,
      at: new Date().toISOString(),
    };
    setFeedback((prev) => [...prev, optimistic]);
    setReply("");
    try {
      await postFellowCapstoneComment(trimmed);
      // Pull the server's authoritative feedback list so the mentor's
      // notification timestamp and the row id reconcile.
      router.refresh();
    } catch (err) {
      // Roll back the optimistic insert and surface the error so the
      // fellow knows their comment didn't actually post.
      setFeedback((prev) => prev.filter((f) => f.id !== optimisticId));
      setReply(trimmed);
      toast.errorFromException("Couldn't post your comment", err);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "Capstone" },
        ]}
      />
      <div data-tour="capstone-heading">
        <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
          My capstone
        </h1>
        <p className="mt-2 max-w-3xl text-gray-600">
          Your capstone is the artefact you ship by Week 12  a brief, audit,
          framework, or policy proposal someone outside the Fellowship can pick
          up and use. Mentor: <span className="font-semibold text-gray-800">{capstone.mentor.fullName}</span>.
        </p>
      </div>

      <div data-tour="capstone-status">
        <StatusBanner
          status={status}
          lastSavedAt={lastSaved}
          wordCount={wordCount}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
          <TitleCard
            title={title}
            onTitleChange={setTitle}
            oneliner={capstone.oneliner}
            sector={capstone.sector}
          />

          <DraftSection
            label="Problem statement"
            description="What is the harm or governance gap, and why does it matter?"
            value={draft.problem}
            onChange={(v) => setDraft({ ...draft, problem: v })}
            maxLength={PROBLEM_MAX}
          />

          <DraftSection
            label="Approach"
            description="How will you address it? Method, framework, deliverable type."
            value={draft.approach}
            onChange={(v) => setDraft({ ...draft, approach: v })}
          />

          <DraftSection
            label="Deliverables"
            description="Concrete artefacts  what will exist by Week 12?"
            value={draft.deliverables}
            onChange={(v) => setDraft({ ...draft, deliverables: v })}
          />

          <DraftSection
            label="Risks & limitations"
            description="What could go wrong, and what's out of scope."
            value={draft.risks}
            onChange={(v) => setDraft({ ...draft, risks: v })}
          />

          {/* Document upload */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
            <h2 className="text-base font-semibold text-gray-800">Upload document</h2>
            <p className="mt-1 text-sm text-gray-500">
              Attach your capstone as a Word (.docx) or PDF. 50 MB max.
            </p>

            {artifactUrl && (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <svg className="h-5 w-5 shrink-0 text-fellowship-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <a
                  href={artifactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-sm font-medium text-fellowship-navy hover:underline"
                >
                  {artifactUrl.split("/").pop() ?? "View document"}
                </a>
                <a
                  href={artifactUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-xs font-semibold text-gray-500 hover:text-fellowship-navy"
                >
                  Download
                </a>
              </div>
            )}

            <div className="mt-3">
              {uploadState === "uploading" ? (
                <div className="space-y-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-fellowship-navy transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Uploading… {uploadProgress}%</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {/* Two pickers — one per format — so it's obvious both Word
                      and PDF are accepted. Both feed the same upload+parse
                      handler; only the `accept` filter differs. */}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    {artifactUrl ? "Replace with Word" : "Upload Word (.docx)"}
                    <input
                      type="file"
                      accept=".docx,.doc,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="sr-only"
                      onChange={onUploadFile}
                      disabled={status === "under-review" || status === "approved"}
                    />
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    {artifactUrl ? "Replace with PDF" : "Upload PDF"}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="sr-only"
                      onChange={onUploadFile}
                      disabled={status === "under-review" || status === "approved"}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 md:p-5">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Ready to hand off to {capstone.mentor.fullName.split(" ")[0]}?
              </p>
              <p className="text-xs text-gray-500">
                Submission opens Week 10  you can keep saving drafts until then.
                {artifactUrl
                  ? " Download a Word copy any time to keep your own backup."
                  : " Download the template to structure your capstone, then upload it above."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="md"
                variant="outline"
                onClick={() => downloadDocx(artifactUrl ? "copy" : "template")}
                disabled={exporting}
              >
                {exporting
                  ? "Preparing…"
                  : artifactUrl
                    ? "Download copy"
                    : "Download template"}
              </Button>
              <Button
                size="md"
                variant="outline"
                onClick={onSaveDraft}
                disabled={savingState === "saving" || submitState === "submitting"}
              >
                {savingState === "saving"
                  ? "Saving…"
                  : savingState === "saved"
                  ? "Saved ✓"
                  : "Save draft"}
              </Button>
              <Button
                size="md"
                variant="fellowship"
                onClick={onSubmit}
                disabled={
                  submitState === "submitting" ||
                  status === "under-review" ||
                  status === "approved"
                }
              >
                {submitState === "submitting"
                  ? "Submitting…"
                  : status === "under-review"
                  ? "Under review"
                  : status === "approved"
                  ? "Approved"
                  : "Submit for review"}
              </Button>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4 md:gap-6">
          <MentorCard
            mentor={capstone.mentor}
            onSendMessage={() => {
              const el = document.getElementById("capstone-feedback-thread");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
          <MilestonesCard milestones={capstone.milestones} />
        </aside>
      </div>

      <FeedbackThread
        feedback={feedback}
        userName={user.fullName}
        reply={reply}
        onReplyChange={setReply}
        onPostReply={onPostReply}
        mentorName={capstone.mentor.fullName}
      />
      {dialog}
    </div>
  );
}

function StatusBanner({
  status,
  lastSavedAt,
  wordCount,
}: {
  status: CapstoneStatus;
  lastSavedAt: string;
  wordCount: number;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-4">
        <StatusBadge status={status} />
        <span className="text-gray-300">·</span>
        <span className="text-sm text-gray-600">
          Last saved <RelativeTime iso={lastSavedAt} />
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-sm text-gray-600">{wordCount} words</span>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: CapstoneStatus }) {
  const map: Record<CapstoneStatus, { color: "info" | "warning" | "success" | "error" | "light"; label: string }> = {
    "not-started": { color: "light", label: "Not started" },
    draft: { color: "warning", label: "Draft" },
    submitted: { color: "info", label: "Submitted" },
    "under-review": { color: "info", label: "Under review" },
    approved: { color: "success", label: "Approved" },
    returned: { color: "error", label: "Returned for revision" },
  };
  const { color, label } = map[status];
  return <Badge color={color}>{label}</Badge>;
}

function TitleCard({
  title,
  onTitleChange,
  oneliner,
  sector,
}: {
  title: string;
  onTitleChange: (next: string) => void;
  oneliner: string;
  sector: string;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Capstone title
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="What is your capstone called?"
              className="mt-1 w-full bg-transparent text-xl font-semibold text-gray-800 outline-none focus:ring-0"
            />
          </label>
          <p className="mt-2 text-sm text-gray-600">{oneliner}</p>
        </div>
        <Badge color="info" variant="light">
          {sector}
        </Badge>
      </div>
    </section>
  );
}

function DraftSection({
  label,
  description,
  value,
  onChange,
  /** When set, shows a live character count and warns before the save limit. */
  maxLength,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
}) {
  // Warn from 90% so a fellow sees it coming rather than discovering it at
  // save time, when a rejected request used to cost them the whole draft.
  const nearLimit = maxLength !== undefined && value.length > maxLength * 0.9;
  const overLimit = maxLength !== undefined && value.length > maxLength;
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-800">{label}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <textarea
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm leading-relaxed text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
      />
      {maxLength !== undefined && nearLimit && (
        <p
          className={`mt-1.5 text-xs ${
            overLimit ? "text-error-600" : "text-warning-600"
          }`}
        >
          {value.length.toLocaleString()} / {maxLength.toLocaleString()} characters
          {overLimit
            ? "  too long to save. Shorten it before saving."
            : "  approaching the limit."}
        </p>
      )}
    </section>
  );
}

function MentorCard({
  mentor,
  onSendMessage,
}: {
  mentor: FellowCapstone["mentor"];
  onSendMessage: () => void;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Your mentor
      </p>
      <div className="mt-3 flex items-center gap-3">
        <AvatarText name={mentor.fullName} className="h-10 w-10" />
        <div>
          <p className="text-sm font-semibold text-gray-800">{mentor.fullName}</p>
          <p className="text-xs text-gray-500">{mentor.email}</p>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        {mentor.expertiseSummary}
      </p>
      <div className="mt-4">
        <Button size="sm" variant="outline" onClick={onSendMessage} className="w-full">
          <PaperPlaneIcon className="h-4 w-4" />
          Reply on the thread
        </Button>
      </div>
    </section>
  );
}

function MilestonesCard({ milestones }: { milestones: CapstoneMilestone[] }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Milestones
      </p>
      <ol className="mt-3 space-y-3">
        {milestones.map((m) => (
          <li key={m.id} className="flex items-start gap-3 text-sm">
            <MilestoneOrb status={m.status} />
            <div className="flex-1">
              <p
                className={`font-medium ${
                  m.status === "complete"
                    ? "text-gray-500 line-through"
                    : m.status === "overdue"
                    ? "text-error-700"
                    : "text-gray-800"
                }`}
              >
                {m.title}
              </p>
              {m.dueAt && (
                <p className="text-xs text-gray-500">
                  {m.weekNumber ? `Week ${m.weekNumber} · ` : ""}
                  {new Date(m.dueAt).toLocaleDateString(undefined, {
                    timeZone: "Africa/Lagos",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function MilestoneOrb({ status }: { status: CapstoneMilestone["status"] }) {
  if (status === "complete") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-600">
        <CheckLineIcon className="h-3 w-3" />
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-fellowship-navy bg-white" />
    );
  }
  if (status === "overdue") {
    return (
      <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-error-500 bg-error-50" />
    );
  }
  return <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-gray-200 bg-white" />;
}

function FeedbackThread({
  feedback,
  userName,
  reply,
  onReplyChange,
  onPostReply,
  mentorName,
}: {
  feedback: CapstoneFeedbackEntry[];
  userName: string;
  reply: string;
  onReplyChange: (v: string) => void;
  onPostReply: () => void;
  mentorName: string;
}) {
  return (
    <section
      id="capstone-feedback-thread"
      className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Mentor feedback thread
        </h2>
        <span className="text-xs text-gray-500">
          {feedback.length} {feedback.length === 1 ? "message" : "messages"}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {feedback.map((f) => (
          <FeedbackBubble key={f.id} entry={f} />
        ))}
      </div>

      <div className="mt-6 border-t border-gray-100 pt-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          Reply as {userName}
        </p>
        <textarea
          rows={3}
          value={reply}
          onChange={(e) => onReplyChange(e.target.value)}
          placeholder={`Reply to ${mentorName}…`}
          className="w-full resize-y rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
        />
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            variant="fellowship"
            onClick={onPostReply}
            disabled={!reply.trim()}
          >
            <PaperPlaneIcon className="h-4 w-4" />
            Post reply
          </Button>
        </div>
      </div>
    </section>
  );
}

function FeedbackBubble({ entry }: { entry: CapstoneFeedbackEntry }) {
  return (
    <div className="flex items-start gap-3">
      <AvatarText name={entry.fromName} className="h-9 w-9" />
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-gray-800">{entry.fromName}</p>
          {entry.fromMentor && (
            <Badge color="info" variant="light">
              Mentor
            </Badge>
          )}
          <span className="text-xs text-gray-500">
            <RelativeTime iso={entry.at} />
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {entry.message}
        </p>
      </div>
    </div>
  );
}

function RelativeTime({ iso }: { iso: string }) {
  const ago = relativeTime(iso);
  return <span>{ago}</span>;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  const months = Math.round(days / 30);
  return `${months} ${months === 1 ? "month" : "months"} ago`;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
