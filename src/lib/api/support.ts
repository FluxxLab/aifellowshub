/**
 * In-app support tickets — types + client helpers (BRD §6.11 ext).
 *
 * Server-side fetchers (used by the admin /support page) live in
 * `support.server.ts`. Client components hit the BFF routes that
 * proxy to the backend.
 */
import { apiFetch } from "./client";

export type SupportTicketStatus = "open" | "closed";

export type SupportTicketReply = {
  id: string;
  message: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    role: string;
  } | null;
};

export type SupportTicket = {
  id: string;
  subject: string;
  message: string;
  status: SupportTicketStatus | string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  requester: {
    id: string;
    fullName: string;
    email: string | null;
    role: string;
  } | null;
  replies: SupportTicketReply[];
};

export async function createSupportTicket(
  subject: string,
  message: string,
): Promise<SupportTicket> {
  const data = await apiFetch<{ ticket: SupportTicket }>(
    "/support/tickets",
    { method: "POST", body: { subject, message } },
  );
  return data.ticket;
}

export async function listMySupportTickets(): Promise<SupportTicket[]> {
  const data = await apiFetch<{ tickets: SupportTicket[] }>(
    "/me/support/tickets",
  );
  return data.tickets ?? [];
}

export async function getSupportTicket(id: string): Promise<SupportTicket> {
  const data = await apiFetch<{ ticket: SupportTicket }>(
    `/support/tickets/${encodeURIComponent(id)}`,
  );
  return data.ticket;
}

export async function replyToSupportTicket(
  id: string,
  message: string,
): Promise<SupportTicket> {
  const data = await apiFetch<{ ticket: SupportTicket }>(
    `/support/tickets/${encodeURIComponent(id)}/replies`,
    { method: "POST", body: { message } },
  );
  return data.ticket;
}

export async function setSupportTicketStatus(
  id: string,
  status: SupportTicketStatus,
): Promise<SupportTicket> {
  const data = await apiFetch<{ ticket: SupportTicket }>(
    `/admin/support/tickets/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: { status } },
  );
  return data.ticket;
}
