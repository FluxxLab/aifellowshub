"use client";
import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/button/Button";
import { ChatIcon, CloseLineIcon, PaperPlaneIcon } from "@/icons";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Phase = "idle" | "submitting" | "done";

/**
 * Floating in-app support widget. Visible on every authenticated
 * page via `LayoutShell`. Pops a slide-over with a small form
 * (subject + message); POSTs to `/api/support/tickets` which the
 * BFF forwards to the backend's support module.
 *
 * Designed to be invisible to users who never need it (single
 * unobtrusive bottom-right button) and bulletproof for users who
 * do — Esc and outside-click close, focus restores, network errors
 * keep the typed message so they don't lose it.
 */
export default function SupportWidget() {
 const [open, setOpen] = useState(false);
 const [subject, setSubject] = useState("");
 const [message, setMessage] = useState("");
 const [phase, setPhase] = useState<Phase>("idle");
 const panelRef = useRef<HTMLDivElement>(null);
 const subjectRef = useRef<HTMLInputElement>(null);

 // Focus the subject field when the panel opens so the user can
 // start typing immediately.
 useEffect(() => {
 if (open) {
 const t = setTimeout(() => subjectRef.current?.focus(), 80);
 return () => clearTimeout(t);
 }
 }, [open]);

 // Esc closes — common pattern across the LMS's modals/dropdowns.
 useEffect(() => {
 if (!open) return;
 const onKey = (e: KeyboardEvent) => {
 if (e.key === "Escape") setOpen(false);
 };
 window.addEventListener("keydown", onKey);
 return () => window.removeEventListener("keydown", onKey);
 }, [open]);

 const canSubmit =
 subject.trim().length >= 3 &&
 message.trim().length >= 10 &&
 phase !== "submitting";

 const reset = () => {
 setSubject("");
 setMessage("");
 setPhase("idle");
 };

 const submit = async () => {
 if (!canSubmit) return;
 setPhase("submitting");
 try {
 await apiFetch("/support/tickets", {
 method: "POST",
 body: { subject: subject.trim(), message: message.trim() },
 });
 setPhase("done");
 toast.success(
 "Support team notified",
 "We'll reach out via email shortly. Thanks for the heads-up.",
 );
 } catch (err) {
 setPhase("idle");
 // Keep the typed text so the user doesn't have to retype.
 toast.errorFromException("Couldn't send your message", err);
 }
 };

 return (
 <>
 {/* Trigger — fixed bottom-right, only when the panel is closed
     so the open panel doesn't overlap its own opener. */}
 {!open && (
 <button
 type="button"
 onClick={() => setOpen(true)}
 aria-label="Open support widget"
 className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-fellowship-navy px-4 py-3 text-sm font-semibold text-white shadow-theme-lg transition-transform hover:scale-105"
 >
 <ChatIcon className="h-5 w-5" />
 <span className="hidden sm:inline">Help</span>
 </button>
 )}

 {/* Backdrop + panel. Click backdrop to close. */}
 {open && (
 <div
 className="fixed inset-0 z-50 flex items-end justify-end bg-black/30 sm:items-end sm:p-5"
 onClick={() => setOpen(false)}
 role="dialog"
 aria-modal="true"
 aria-label="Support widget"
 >
 <div
 ref={panelRef}
 onClick={(e) => e.stopPropagation()}
 className={cn(
 "w-full max-w-md rounded-t-2xl bg-white shadow-theme-lg sm:rounded-2xl",
 "max-h-[85vh] overflow-y-auto",
 )}
 >
 <header className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
 <div>
 <h2 className="text-base font-semibold text-gray-800">
 How can we help?
 </h2>
 <p className="mt-0.5 text-xs text-gray-500">
 Drop us a note and a programme admin will get back to you.
 </p>
 </div>
 <button
 type="button"
 onClick={() => setOpen(false)}
 aria-label="Close support widget"
 className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
 >
 <CloseLineIcon className="h-5 w-5" />
 </button>
 </header>

 {phase === "done" ? (
 <div className="px-5 py-6 text-center">
 <p className="text-sm font-semibold text-gray-800">
 Message sent.
 </p>
 <p className="mt-2 text-sm text-gray-600">
 The programme team has been notified. They&apos;ll reach
 out via email shortly.
 </p>
 <div className="mt-5 flex justify-center gap-2">
 <Button
 size="sm"
 variant="outline"
 onClick={() => {
 reset();
 setOpen(false);
 }}
 >
 Done
 </Button>
 <Button size="sm" variant="fellowship" onClick={reset}>
 Send another
 </Button>
 </div>
 </div>
 ) : (
 <div className="space-y-4 px-5 py-4">
 <div>
 <label
 htmlFor="support-subject"
 className="text-xs font-medium uppercase tracking-wide text-gray-500"
 >
 Subject
 </label>
 <input
 id="support-subject"
 ref={subjectRef}
 type="text"
 value={subject}
 onChange={(e) => setSubject(e.target.value)}
 placeholder="What's this about?"
 maxLength={200}
 className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
 />
 </div>
 <div>
 <label
 htmlFor="support-message"
 className="text-xs font-medium uppercase tracking-wide text-gray-500"
 >
 Message
 </label>
 <textarea
 id="support-message"
 value={message}
 onChange={(e) => setMessage(e.target.value)}
 rows={5}
 placeholder="Describe the issue with as much detail as you can — what you did, what you expected, what happened."
 maxLength={5000}
 className="mt-1 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
 />
 <p className="mt-1 text-right text-xs text-gray-400">
 {message.length} / 5000
 </p>
 </div>

 <div className="flex justify-end gap-2 pt-1">
 <Button
 size="sm"
 variant="outline"
 onClick={() => setOpen(false)}
 disabled={phase === "submitting"}
 >
 Cancel
 </Button>
 <Button
 size="sm"
 variant="fellowship"
 onClick={submit}
 disabled={!canSubmit}
 >
 <PaperPlaneIcon className="h-4 w-4" />
 {phase === "submitting" ? "Sending…" : "Send"}
 </Button>
 </div>
 </div>
 )}
 </div>
 </div>
 )}
 </>
 );
}
