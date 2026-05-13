import "server-only";
import { backendFetch } from "./backend";
import type { SupportTicket } from "./support";

/**
 * Server-side fetcher for the admin's support queue. Returns an
 * empty list on transport errors so the page can still render.
 */
export async function listAdminSupportTicketsServer(): Promise<SupportTicket[]> {
  try {
    const res = await backendFetch("/admin/support/tickets", { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as { tickets: SupportTicket[] };
    return data.tickets ?? [];
  } catch {
    return [];
  }
}
