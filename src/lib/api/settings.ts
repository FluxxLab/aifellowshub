/**
 * Programme settings — admin types + client-safe mutators (BRD §5/§6
 * admin tools). Reads run server-side via `settings.server.ts`; this file
 * holds the public types and the four section-PATCH helpers the
 * `SettingsView` calls on save.
 */
import { apiFetch } from "./client";

export type CohortSettings = {
  id: string;
  name: string;
  description: string;
  /** ISO date (yyyy-mm-dd). */
  startDate: string;
  endDate: string;
  weekCount: number;
};

export type RegistrationSettings = {
  isOpen: boolean;
  capacity: number;
  enrolledCount: number;
  waitlistEnabled: boolean;
  /** ISO date — null means "open until capacity hits". */
  registrationCloseDate: string | null;
};

export type SessionReminderRule = {
  /** Hours before the session start at which to fire. */
  hoursBefore: number;
  enabled: boolean;
};

export type NotificationSettings = {
  /** New-fellow defaults — they can override per-event in their profile. */
  defaultEmail: boolean;
  defaultPush: boolean;
  defaultInApp: boolean;
  sessionReminders: SessionReminderRule[];
};

export type ProgrammeDefaults = {
  /** Default pass mark % applied to newly created assessments. */
  assessmentPassMark: number;
  /**
   * Default attendance threshold (% of session duration) for auto-credit.
   * BRD §6.4 default = 50%.
   */
  attendanceThresholdPercent: number;
};

export type Settings = {
  cohort: CohortSettings;
  registration: RegistrationSettings;
  notifications: NotificationSettings;
  defaults: ProgrammeDefaults;
};

/* ---------- Client-side mutators ---------- */

export type CohortPatch = Partial<{
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  weekCount: number;
}>;

export async function updateCohortSettings(patch: CohortPatch): Promise<Settings> {
  return apiFetch<Settings>("/settings/cohort", {
    method: "PATCH",
    body: patch,
  });
}

export type RegistrationPatch = Partial<{
  isOpen: boolean;
  capacity: number;
  waitlistEnabled: boolean;
  registrationCloseDate: string | null;
}>;

export async function updateRegistrationSettings(
  patch: RegistrationPatch,
): Promise<Settings> {
  return apiFetch<Settings>("/settings/registration", {
    method: "PATCH",
    body: patch,
  });
}

export type NotificationsPatch = Partial<{
  defaultEmail: boolean;
  defaultPush: boolean;
  defaultInApp: boolean;
  sessionReminders: SessionReminderRule[];
}>;

export async function updateNotificationSettings(
  patch: NotificationsPatch,
): Promise<Settings> {
  return apiFetch<Settings>("/settings/notifications", {
    method: "PATCH",
    body: patch,
  });
}

export type DefaultsPatch = Partial<{
  assessmentPassMark: number;
  attendanceThresholdPercent: number;
}>;

export async function updateDefaultsSettings(
  patch: DefaultsPatch,
): Promise<Settings> {
  return apiFetch<Settings>("/settings/defaults", {
    method: "PATCH",
    body: patch,
  });
}
