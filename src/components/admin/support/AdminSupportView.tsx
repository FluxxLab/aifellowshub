"use client";
import { useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { PaperPlaneIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import {
  getSupportTicket,
  replyToSupportTicket,
  setSupportTicketStatus,
  type SupportTicket,
} from "@/lib/api/support";

type Filter = "open" | "closed" | "all";

/**
 * Admin support queue + thread view. Left rail lists tickets,
 * right pane shows the selected ticket's thread with reply +
 * resolve/reopen controls.
 *
 * State is local-only — server-rendered list is the initial
 * snapshot, then every action returns the updated row and we
 * splice it back into the list so the UI stays in sync without
 * a full page refresh.
 */
export default function AdminSupportView({
  initial,
}: {
  initial: SupportTicket[];
}) {
  const { confirm, dialog } = useConfirm();
  const [tickets, setTickets] = useState<SupportTicket[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(
    initial[0]?.id ?? null,
  );
  const [filter, setFilter] = useState<Filter>("open");

  const filtered = useMemo(() => {
    if (filter === "all") return tickets;
    return tickets.filter((t) => t.status === filter);
  }, [tickets, filter]);

  const selected = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? null,
    [tickets, selectedId],
  );

  // Replace one ticket in the list (after reply / status change)
  // and bubble it to the top of its status group so freshly-active
  // tickets stay visible.
  const replaceTicket = (next: SupportTicket) => {
    setTickets((prev) => {
      const rest = prev.filter((t) => t.id !== next.id);
      return [next, ...rest].sort((a, b) => {
        if (a.status !== b.status) return a.status === "open" ? -1 : 1;
        return +new Date(b.updatedAt) - +new Date(a.updatedAt);
      });
    });
  };

  return (
    <>
      {dialog}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <aside className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {(["open", "closed", "all"] as Filter[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  filter === id
                    ? "bg-fellowship-navy text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                )}
              >
                {id === "open" ? "Open" : id === "closed" ? "Resolved" : "All"}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              No tickets in this view.
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {filtered.map((t) => {
                const isSelected = t.id === selectedId;
                const lastAt =
                  t.replies.length > 0
                    ? t.replies[t.replies.length - 1].createdAt
                    : t.updatedAt;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      className={cn(
                        "flex w-full flex-col gap-1 rounded-2xl border p-3 text-left transition-colors",
                        isSelected
                          ? "border-fellowship-navy bg-fellowship-navy/5"
                          : "border-gray-200 bg-white hover:bg-gray-50",
                      )}
                    >
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
                      <p className="text-xs text-gray-500">
                        {t.requester?.fullName ?? "Unknown"} ·{" "}
                        {t.requester?.role ?? "—"}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400">
                          {t.replies.length} repl
                          {t.replies.length === 1 ? "y" : "ies"} ·{" "}
                          {relativeTime(lastAt)}
                        </p>
                        {t.replies.some((r) => r.isAiReply) && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                            AI replied
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section>
          {selected ? (
            <TicketDetail
              ticket={selected}
              onUpdated={replaceTicket}
              confirm={confirm}
            />
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
              Select a ticket on the left to see the thread.
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function TicketDetail({
  ticket,
  onUpdated,
  confirm,
}: {
  ticket: SupportTicket;
  onUpdated: (next: SupportTicket) => void;
  confirm: (opts: {
    title: string;
    message?: string;
    confirmLabel?: string;
    tone?: "danger" | "default";
  }) => Promise<boolean>;
}) {
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [busyStatus, setBusyStatus] = useState(false);

  const send = async () => {
    const trimmed = reply.trim();
    if (trimmed.length === 0 || sending) return;
    setSending(true);
    try {
      const next = await replyToSupportTicket(ticket.id, trimmed);
      onUpdated(next);
      setReply("");
    } catch (err) {
      toast.errorFromException("Couldn't send reply", err);
    } finally {
      setSending(false);
    }
  };

  const toggleStatus = async () => {
    if (busyStatus) return;
    const closing = ticket.status === "open";
    if (closing) {
      const ok = await confirm({
        title: "Mark this ticket as resolved?",
        message:
          "The requester sees a resolved badge. They can still reply, which will reopen it automatically.",
        confirmLabel: "Resolve",
      });
      if (!ok) return;
    }
    setBusyStatus(true);
    try {
      const next = await setSupportTicketStatus(
        ticket.id,
        closing ? "closed" : "open",
      );
      onUpdated(next);
      toast.success(
        closing ? "Ticket resolved" : "Ticket reopened",
      );
    } catch (err) {
      toast.errorFromException("Couldn't update ticket", err);
    } finally {
      setBusyStatus(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <header className="border-b border-gray-100 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-800">
                {ticket.subject}
              </h2>
              <Badge
                color={ticket.status === "open" ? "warning" : "success"}
                variant="light"
              >
                {ticket.status === "open" ? "Open" : "Resolved"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              From{" "}
              <span className="font-medium text-gray-700">
                {ticket.requester?.fullName ?? "Unknown"}
              </span>
              {ticket.requester?.email && (
                <>
                  {" · "}
                  <a
                    href={`mailto:${ticket.requester.email}`}
                    className="text-fellowship-navy hover:underline"
                  >
                    {ticket.requester.email}
                  </a>
                </>
              )}
              {ticket.requester?.role && (
                <> · {ticket.requester.role}</>
              )}
            </p>
          </div>
          <Button
            size="sm"
            variant={ticket.status === "open" ? "fellowship" : "outline"}
            onClick={toggleStatus}
            disabled={busyStatus}
          >
            {busyStatus
              ? "Working…"
              : ticket.status === "open"
                ? "Mark resolved"
                : "Reopen"}
          </Button>
        </div>
      </header>

      <div className="space-y-3 p-5 md:p-6">
        <ThreadBubble
          fromAdmin={false}
          author={ticket.requester?.fullName ?? "Requester"}
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

      <div className="border-t border-gray-100 p-5 md:p-6">
        <textarea
          rows={3}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reply as the support team…"
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
