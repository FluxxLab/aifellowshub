/**
 * Server-only programme settings fetcher. Reads from the backend's
 * `/settings` endpoint. Falls back to safe defaults when the backend is
 * unreachable so the page can still render (the form will just save once
 * the backend's back).
 */
import "server-only";
import { backendFetch } from "./backend";
import type { Settings } from "./settings";

const FALLBACK: Settings = {
  cohort: {
    id: "cohort-default",
    name: "AI Fellows · Cohort",
    description: "12-week fellowship on AI ethics and governance.",
    startDate: "",
    endDate: "",
    weekCount: 12,
  },
  registration: {
    isOpen: true,
    capacity: 100,
    enrolledCount: 0,
    waitlistEnabled: true,
    registrationCloseDate: null,
  },
  notifications: {
    defaultEmail: true,
    defaultPush: true,
    defaultInApp: true,
    sessionReminders: [
      { hoursBefore: 24, enabled: true },
      { hoursBefore: 1, enabled: true },
      { hoursBefore: 0.0833, enabled: true },
    ],
  },
  defaults: {
    assessmentPassMark: 70,
    attendanceThresholdPercent: 50,
  },
};

export async function getSettingsServer(): Promise<Settings> {
  try {
    const res = await backendFetch("/settings", { method: "GET" });
    if (!res.ok) return FALLBACK;
    return (await res.json()) as Settings;
  } catch {
    return FALLBACK;
  }
}
