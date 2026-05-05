"use client";
import React, { useEffect, useRef, useState } from "react";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { BoltIcon, PaperPlaneIcon } from "@/icons";
import { toast } from "@/lib/toast";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import {
  getAiBuddy,
  sendAiMessage,
  resetAiBuddy,
  ApiError,
  type AiMessage,
  type AiQuota,
} from "@/lib/api/ai-buddy";

/**
 * AI Buddy chat (BRD §6.7).
 *
 * Backed by `POST /me/ai/buddy/messages` with a 50/day quota enforced
 * server-side. When `ANTHROPIC_API_KEY` isn't set, the backend returns a
 * clearly-marked stub response — the UI still flows end-to-end so the
 * demo is testable without an API key.
 */

const DAILY_LIMIT = 50;

const SUGGESTED_PROMPTS = [
  "Explain the EU AI Act risk tiers in plain language.",
  "What is a model card and when should I write one?",
  "Help me scope a capstone on health AI in Kenya.",
  "How does Ubuntu ethics differ from utilitarian AI ethics?",
];

const GREETING: AiMessage = {
  id: "m-greeting",
  role: "assistant",
  content:
    "Hi — I'm your AI Buddy. I can help you work through Fellowship readings, draft policy briefs, scope your capstone, and prep for assessments. What would you like to start with?",
  stubbed: false,
  createdAt: new Date().toISOString(),
};

export default function AiBuddyChat() {
  const user = useCurrentUser();
  const { confirm, dialog } = useConfirm();
  const [messages, setMessages] = useState<AiMessage[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const [quota, setQuota] = useState<AiQuota>({
    used: 0,
    limit: DAILY_LIMIT,
    remaining: DAILY_LIMIT,
  });
  const [thinking, setThinking] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initial load: fetch conversation + quota.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const state = await getAiBuddy();
        if (!alive) return;
        setQuota(state.quota);
        setMessages(
          state.conversation.messages.length > 0
            ? state.conversation.messages
            : [GREETING],
        );
      } catch {
        // Backend offline — keep the greeting bubble so UI is testable.
      }
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking]);

  const quotaExhausted = quota.remaining <= 0;

  const send = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || thinking || quotaExhausted) return;

    // Optimistic user bubble — replaced once the backend round-trip returns.
    // eslint-disable-next-line react-hooks/purity -- runs in an event handler, not render
    const optimisticId = `tmp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        role: "user",
        content: trimmed,
        stubbed: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft("");
    setThinking(true);

    try {
      const result = await sendAiMessage(trimmed);
      setMessages((prev) => [...prev, result.message]);
      setQuota(result.quota);
    } catch (err) {
      // Roll the user bubble back; restore the draft so they can retry.
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setDraft(trimmed);
      if (err instanceof ApiError && err.status === 429) {
        setQuota((q) => ({ ...q, remaining: 0 }));
        toast.error("Daily quota reached", err.message);
      } else {
        toast.errorFromException("Couldn't reach AI Buddy", err);
      }
    }
    setThinking(false);
    textareaRef.current?.focus();
  };

  const onReset = async () => {
    const ok = await confirm({
      title: "Clear conversation?",
      message:
        "Wipes the chat history. Your daily quota is unchanged — already-used messages still count.",
      confirmLabel: "Clear",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await resetAiBuddy();
      setMessages([GREETING]);
      toast.success("Conversation cleared");
    } catch (err) {
      toast.errorFromException("Couldn't reset", err);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/home" },
          { label: "AI Buddy" },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
            AI Buddy
          </h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Your study companion. Ask questions about the curriculum, work
            through assessment prep, or explore ideas for your capstone.
          </p>
        </div>
        <QuotaBadge remaining={quota.remaining} limit={quota.limit} />
      </div>

      <section className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-fellowship-navy text-warning-400">
            <BoltIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">
              Fellowship AI Buddy
            </p>
            <p className="text-xs text-gray-500">
              Trained on the Fellowship curriculum, BRD-aligned readings, and
              African AI governance sources.
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            disabled={loading || thinking}
            className="text-xs font-medium text-error-600 hover:underline disabled:opacity-40"
          >
            Clear chat
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex h-[480px] flex-col gap-4 overflow-y-auto px-5 py-5 custom-scrollbar"
        >
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              userName={user.fullName}
            />
          ))}
          {thinking && <ThinkingBubble />}
        </div>

        <div className="border-t border-gray-100 bg-white px-5 py-4">
          {messages.length <= 1 && !thinking && (
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  disabled={quotaExhausted || loading}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 transition-colors hover:border-fellowship-navy/30 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(draft);
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={textareaRef}
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(draft);
                }
              }}
              placeholder={
                quotaExhausted
                  ? "You've reached today's limit. Quota resets in 24h."
                  : "Ask AI Buddy anything…"
              }
              disabled={quotaExhausted || thinking || loading}
              className="flex-1 resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10 disabled:cursor-not-allowed disabled:bg-gray-50"
            />
            <Button
              size="md"
              variant="fellowship"
              type="submit"
              disabled={!draft.trim() || quotaExhausted || thinking || loading}
            >
              <PaperPlaneIcon className="h-4 w-4" />
              Send
            </Button>
          </form>
          <p className="mt-2 text-xs text-gray-400">
            Enter to send · Shift+Enter for a new line · 50 messages/day per
            fellow (BRD §6.7)
          </p>
        </div>
      </section>

      {dialog}
    </div>
  );
}

function MessageBubble({
  message,
  userName,
}: {
  message: AiMessage;
  userName: string;
}) {
  const isUser = message.role === "user";
  return (
    <div
      className={`flex items-start gap-3 ${
        isUser ? "flex-row-reverse" : ""
      }`}
    >
      {isUser ? (
        <AvatarText name={userName} className="h-8 w-8 text-xs" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fellowship-navy text-warning-400">
          <BoltIcon className="h-4 w-4" />
        </div>
      )}
      <div className="flex max-w-[80%] flex-col gap-1">
        {!isUser && message.stubbed && (
          <Badge color="warning" variant="light">
            Demo response (no LLM key set)
          </Badge>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-fellowship-navy text-white"
              : "bg-gray-50 text-gray-800"
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fellowship-navy text-warning-400">
        <BoltIcon className="h-4 w-4" />
      </div>
      <div className="rounded-2xl bg-gray-50 px-4 py-3">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
        </span>
      </div>
    </div>
  );
}

function QuotaBadge({
  remaining,
  limit,
}: {
  remaining: number;
  limit: number;
}) {
  const pct = limit === 0 ? 0 : (remaining / limit) * 100;
  const intent: "success" | "warning" | "error" =
    pct > 50 ? "success" : pct > 20 ? "warning" : "error";
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Today&apos;s quota
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-800">{remaining}</span>
        <span className="text-sm text-gray-500">/ {limit}</span>
        <Badge color={intent} variant="light">
          {Math.round(pct)}%
        </Badge>
      </div>
      <div className="mt-2 h-1.5 w-32 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full transition-[width] duration-300 ${
            intent === "success"
              ? "bg-success-500"
              : intent === "warning"
              ? "bg-warning-500"
              : "bg-error-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
