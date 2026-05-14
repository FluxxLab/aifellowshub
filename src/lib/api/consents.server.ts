/**
 * Server-only admin consent register fetcher. Wraps the BFF call so
 * the page component stays focused on rendering.
 */
import "server-only";
import { backendFetch } from "./backend";

export type FellowConsentRow = {
  id: string;
  fullName: string;
  email: string;
  country: string | null;
  sector: string | null;
  joinedAt: string;
  codeOfConductAcceptedAt: string | null;
  dataConsentAcceptedAt: string | null;
  consentRecordingOptIn: boolean;
  consentCommsOptIn: boolean;
  consentAlumniCommsOptIn: boolean;
  consentSignatureName: string | null;
  consentCountry: string | null;
  bothSigned: boolean;
};

export async function listFellowConsentsServer(): Promise<FellowConsentRow[]> {
  try {
    const res = await backendFetch("/admin/consents", { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as { consents: FellowConsentRow[] };
    return data.consents ?? [];
  } catch {
    return [];
  }
}

export async function getFellowConsentServer(
  fellowId: string,
): Promise<FellowConsentRow | null> {
  try {
    const res = await backendFetch(
      `/admin/consents/${encodeURIComponent(fellowId)}`,
      { method: "GET" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { consent: FellowConsentRow };
    return data.consent ?? null;
  } catch {
    return null;
  }
}
