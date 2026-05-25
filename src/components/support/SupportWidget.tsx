"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  ChatIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseLineIcon,
  PaperPlaneIcon,
} from "@/icons";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  createSupportTicket,
  getSupportTicket,
  listMySupportTickets,
  resolveMyTicket,
  replyToSupportTicket,
  type SupportTicket,
} from "@/lib/api/support";

type View =
  | { mode: "list" }
  | { mode: "thread"; ticketId: string }
  | { mode: "new" };

/**
 * In-app support widget. Visible on every authenticated page via
 * `LayoutShell`. Three modes:
 *
 *   list   — the user's existing tickets (status, last activity).
 *            Default landing view when they open the widget.
 *   thread — a single ticket's conversation + a reply box.
 *   new    — start a new ticket (subject + message).
 *
 * The user can always get back to the list with the back arrow.
 * Esc and outside-click close the panel entirely (panel state is
 * not preserved across opens — fresh load every time, since the
 * cost of re-fetching is small and reading stale ticket state is
 * worse than the extra request).
 */
export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ mode: "list" });
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadTickets = useCallback(async () => {
    setTicketsLoading(true);
    try {
      const list = await listMySupportTickets();
      setTickets(list);
    } catch {
      // Quiet — the empty list will render and the user can still
      // start a new ticket. A toast here would be noise.
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadTickets();
      setView({ mode: "list" });
    }
  }, [open, loadTickets]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
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
            <Header
              view={view}
              onBack={() => setView({ mode: "list" })}
              onClose={() => setOpen(false)}
            />

            {view.mode === "list" && (
              <ListView
                tickets={tickets}
                loading={ticketsLoading}
                onOpenTicket={(id) => setView({ mode: "thread", ticketId: id })}
                onNew={() => setView({ mode: "new" })}
              />
            )}

            {view.mode === "new" && (
              <NewTicketView
                onCancel={() => setView({ mode: "list" })}
                onCreated={async () => {
                  await loadTickets();
                  setView({ mode: "list" });
                }}
              />
            )}

            {view.mode === "thread" && (
              <ThreadView
                ticketId={view.ticketId}
                onUpdated={loadTickets}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Header({
  view,
  onBack,
  onClose,
}: {
  view: View;
  onBack: () => void;
  onClose: () => void;
}) {
  const title =
    view.mode === "list"
      ? "Support"
      : view.mode === "new"
        ? "New support request"
        : "Ticket";
  const subtitle =
    view.mode === "list"
      ? "Your tickets. Click any one to reply, or start a new request."
      : view.mode === "new"
        ? "Programme admins will get a notification and follow up."
        : "Programme admin replies appear inline below.";
  return (
    <header className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
      <div className="flex items-start gap-2">
        {view.mode !== "list" && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="mt-0.5 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        )}
        <div>
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close support widget"
        className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <CloseLineIcon className="h-5 w-5" />
      </button>
    </header>
  );
}

function ListView({
  tickets,
  loading,
  onOpenTicket,
  onNew,
}: {
  tickets: SupportTicket[];
  loading: boolean;
  onOpenTicket: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="px-5 py-4">
      <Button
        size="sm"
        variant="fellowship"
        onClick={onNew}
        className="mb-4 w-full"
      >
        + New support request
      </Button>
      {loading ? (
        <p className="text-sm text-gray-500">Loading your tickets…</p>
      ) : tickets.length === 0 ? (
        <p className="text-sm text-gray-500">
          No tickets yet. Send one above and we&apos;ll get back to you.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tickets.map((t) => {
            const lastAt =
              t.replies.length > 0
                ? t.replies[t.replies.length - 1].createdAt
                : t.updatedAt;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onOpenTicket(t.id)}
                  className="flex w-full items-start gap-3 rounded-lg border border-gray-200 p-3 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {t.subject}
                      </p>
                      <Badge
                        color={t.status === "open" ? "warning" : "success"}
                        variant="light"
                      >
                        {t.status === "open" ? "Open" : "Resolved"}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {t.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {t.replies.length} repl
                      {t.replies.length === 1 ? "y" : "ies"} ·{" "}
                      {relativeTime(lastAt)}
                    </p>
                  </div>
                  <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-gray-300" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NewTicketView({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: () => Promise<void> | void;
}) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const subjectRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => subjectRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const canSubmit =
    subject.trim().length >= 3 && message.trim().length >= 10 && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await createSupportTicket(subject.trim(), message.trim());
      toast.success(
        "Support team notified",
        "We'll follow up shortly. You'll see their reply on this widget.",
      );
      await onCreated();
    } catch (err) {
      toast.errorFromException("Couldn't send your message", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
          onClick={onCancel}
          disabled={submitting}
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
          {submitting ? "Sending…" : "Send"}
        </Button>
      </div>
    </div>
  );
}

function ThreadView({
  ticketId,
  onUpdated,
}: {
  ticketId: string;
  onUpdated: () => Promise<void> | void;
}) {
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const t = await getSupportTicket(ticketId);
        if (!cancelled) setTicket(t);
      } catch (err) {
        if (!cancelled) toast.errorFromException("Couldn't load ticket", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  const send = async () => {
    if (!ticket || sending || reply.trim().length === 0) return;
    setSending(true);
    try {
      const updated = await replyToSupportTicket(ticketId, reply.trim());
      setTicket(updated);
      setReply("");
      await onUpdated();
    } catch (err) {
      toast.errorFromException("Couldn't send your reply", err);
    } finally {
      setSending(false);
    }
  };

  const markResolved = async () => {
    if (!ticket || resolving) return;
    setResolving(true);
    try {
      const updated = await resolveMyTicket(ticketId);
      setTicket(updated);
      await onUpdated();
      toast.success("Ticket closed", "Glad we could help!");
    } catch (err) {
      toast.errorFromException("Couldn't close ticket", err);
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return <p className="px-5 py-4 text-sm text-gray-500">Loading thread…</p>;
  }
  if (!ticket) {
    return <p className="px-5 py-4 text-sm text-gray-500">Ticket not found.</p>;
  }

  return (
    <div className="flex flex-col">
      <div className="space-y-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800">
            {ticket.subject}
          </h3>
          <Badge
            color={ticket.status === "open" ? "warning" : "success"}
            variant="light"
          >
            {ticket.status === "open" ? "Open" : "Resolved"}
          </Badge>
        </div>
        <ThreadBubble
          fromAdmin={false}
          author={ticket.requester?.fullName ?? "You"}
          message={ticket.message}
          at={ticket.createdAt}
        />
        {ticket.replies.map((r) => {
          const fromAdmin =
            r.isAiReply ||
            r.author?.role === "admin" ||
            r.author?.role === "super_admin";
          return (
            <ThreadBubble
              key={r.id}
              fromAdmin={fromAdmin}
              isAi={r.isAiReply}
              author={r.isAiReply ? "Support" : (r.author?.fullName ?? "—")}
              message={r.message}
              at={r.createdAt}
            />
          );
        })}
      </div>
      {ticket.status === "open" && ticket.replies.some((r) => r.isAiReply) && (
        <div className="mx-5 mb-1 flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-xs text-green-800">Did this answer your question?</p>
          <Button
            size="sm"
            variant="outline"
            onClick={markResolved}
            disabled={resolving}
            className="shrink-0 border-green-600 text-green-700 hover:bg-green-100"
          >
            {resolving ? "Closing…" : "Yes, close ticket"}
          </Button>
        </div>
      )}

      <div className="border-t border-gray-100 px-5 py-3">
        <textarea
          rows={3}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder={
            ticket.status === "closed"
              ? "Reply will reopen this ticket…"
              : "Type a reply…"
          }
          maxLength={5000}
          className="w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
        />
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            variant="fellowship"
            onClick={send}
            disabled={sending || reply.trim().length === 0}
          >
            <PaperPlaneIcon className="h-4 w-4" />
            {sending ? "Sending…" : "Send reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ThreadBubble({
  fromAdmin,
  isAi = false,
  author,
  message,
  at,
}: {
  fromAdmin: boolean;
  isAi?: boolean;
  author: string;
  message: string;
  at: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-sm",
        fromAdmin
          ? "border-fellowship-navy/20 bg-fellowship-navy/5"
          : "border-gray-200 bg-white",
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span
          className={cn(
            "font-semibold",
            fromAdmin ? "text-fellowship-navy" : "text-gray-700",
          )}
        >
          {author}
          {fromAdmin && (
            <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-gray-400">
              {isAi ? "AI · Support team" : "Support team"}
            </span>
          )}
        </span>
        <span className="text-gray-400">{relativeTime(at)}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm text-gray-700">{message}</p>
    </div>
  );
}

function relativeTime(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}
