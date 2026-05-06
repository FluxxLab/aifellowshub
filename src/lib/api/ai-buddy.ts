/**
 * AI Learning Buddy — client interface (BRD §6.7).
 *
 * The chat is a single persistent conversation per fellow with a 20/day
 * quota. The backend handles persistence + LLM call + rate limiting; this
 * file is the typed wrapper over the BFF proxy.
 */
import { ApiError, apiFetch } from "./client";

export type AiMessageRole = "user" | "assistant" | "system";

export type AiMessage = {
  id: string;
  role: AiMessageRole;
  content: string;
  /** True when the assistant message came from the demo stub (no LLM key set). */
  stubbed: boolean;
  createdAt: string;
};

export type AiQuota = {
  used: number;
  limit: number;
  remaining: number;
};

export type AiBuddyState = {
  conversation: {
    id: string;
    title: string;
    messages: AiMessage[];
    updatedAt: string;
  };
  quota: AiQuota;
};

export async function getAiBuddy(): Promise<AiBuddyState> {
  return apiFetch<AiBuddyState>("/me/ai/buddy");
}

export type SendMessageResult = {
  message: AiMessage;
  quota: AiQuota;
};

/**
 * Throws `ApiError` with status 429 + code `ai_quota_exceeded` when the
 * fellow has burned through the day's allowance.
 */
export async function sendAiMessage(content: string): Promise<SendMessageResult> {
  return apiFetch<SendMessageResult>("/me/ai/buddy/messages", {
    method: "POST",
    body: { content },
  });
}

export async function resetAiBuddy(): Promise<{ cleared: number }> {
  return apiFetch<{ cleared: number }>("/me/ai/buddy/reset", {
    method: "POST",
  });
}

export { ApiError };
