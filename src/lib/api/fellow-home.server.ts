/**
 * Server-only fellow home aggregate.
 *
 * Composed from existing backend endpoints (curriculum, sessions, ai-buddy,
 * capstone, notifications) so we don't need a dedicated `/me/home`
 * endpoint. Each component falls back to a sensible zero-state if its
 * source is unreachable.
 */
import "server-only";
import { backendFetch } from "./backend";

export type FellowHome = {
  cohort: { name: string; currentWeek: number; totalWeeks: number };
  metrics: {
    modulesComplete: { value: number; total: number };
    attendanceRatePercent: number;
    aiBuddyRemaining: { value: number; dailyLimit: number };
    capstoneStatus: "Not started" | "Draft" | "Under review" | "Approved" | "Returned";
  };
  currentModule: {
    weekNumber: number;
    title: string;
    nextLesson: string;
    progressPercent: number;
  } | null;
  nextSession: {
    title: string;
    weekNumber: number;
    startsAt: string;
    durationMinutes: number;
    hostName: string;
  } | null;
  recentActivity: { id: string; message: string; at: string }[];
};

type BackendCurriculumModule = {
  id: string;
  weekNumber: number;
  title: string;
  lessons: { id: string; title: string }[];
  myAttempts: {
    bestStatus: "passed" | "failed" | "pending_review" | null;
    attemptsUsed: number;
  };
  session: {
    status: "scheduled" | "live" | "ended" | "cancelled";
    startsAt: string;
    myAttendance: {
      status: "rsvpd" | "attended" | "attended_recording" | "missed";
    } | null;
  } | null;
  unlocked: boolean;
};

type BackendSession = {
  id: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  status: "scheduled" | "live" | "ended" | "cancelled";
  host: { fullName: string } | null;
  module: { weekNumber: number } | null;
};

type BackendAi = { quota: { used: number; limit: number; remaining: number } };
type BackendCapstone = {
  status: "draft" | "under_review" | "needs_revision" | "approved";
} | null;
type BackendNotifications = {
  notifications: { id: string; title: string; createdAt: string }[];
};

export async function getFellowHomeServer(): Promise<FellowHome> {
  const [curriculum, sessions, ai, capstone, notifs] = await Promise.all([
    safeJson<{ modules: BackendCurriculumModule[] }>("/me/curriculum"),
    safeJson<{ sessions: BackendSession[] }>("/me/sessions"),
    safeJson<BackendAi>("/me/ai/buddy"),
    safeJson<{ capstone: BackendCapstone }>("/me/capstone"),
    safeJson<BackendNotifications>("/me/notifications"),
  ]);

  const modules = curriculum?.modules ?? [];
  // Use real module data instead of hardcoded 12. Both the "Week X of
  // Y" subhead and the Modules-complete tile compare against the
  // *count* of published modules so the two numbers always agree.
  // Previously totalWeeks used max(weekNumber), which underreported by
  // one whenever Onboarding (Week 0) was published — fellows saw
  // "Week 0 of 8" alongside "0 / 9 modules complete" and were rightly
  // confused. Defaults to 0 when nothing's published, so a fresh
  // cohort doesn't see fictitious counts anywhere.
  const totalModules = modules.length;
  const totalWeeks = totalModules;
  // Orientation (Week 0 with title matching /onboarding/i) was run
  // outside the LMS, so it has no attendance row and no assessment.
  // Treat it as completed for tile/progress purposes — same override
  // already applied in the curriculum + sessions mappers.
  const isOnboarding = (m: BackendCurriculumModule) =>
    m.weekNumber <= 0 && /onboarding/i.test(m.title);
  const attendedStatuses = new Set(["attended", "attended_recording"]);
  const isCompleted = (m: BackendCurriculumModule) =>
    isOnboarding(m) ||
    m.myAttempts.bestStatus === "passed" ||
    (m.session?.myAttendance?.status != null &&
      attendedStatuses.has(m.session.myAttendance.status));
  const completed = modules.filter(isCompleted).length;
  const currentModule = pickCurrentModule(modules, isCompleted);
  // Clamp to the curriculum's range so "Week 1 of 0" never happens.
  // When no modules exist, currentWeek = 0.
  const currentWeek =
    currentModule?.weekNumber ??
    Math.min(totalWeeks, Math.max(0, completed + 1));

  // Attendance rate: derive from curriculum data directly rather than
  // cross-joining the sessions list. Each curriculum module already carries
  // session.myAttendance, so the join is unnecessary and fragile (breaks
  // when s.module is null or weekNumbers drift). Count only modules whose
  // session has actually ended (status === "ended" AND startsAt in the past,
  // or myAttendance is "attended"/"missed" — either signal means it ran).
  const modulesWithPastSession = modules.filter((m) => {
    if (isOnboarding(m) || !m.session) return false;
    const sessionEnded =
      m.session.status === "ended" &&
      new Date(m.session.startsAt).getTime() < Date.now();
    const attendanceSettled =
      m.session.myAttendance?.status === "attended" ||
      m.session.myAttendance?.status === "attended_recording" ||
      m.session.myAttendance?.status === "missed";
    return sessionEnded || attendanceSettled;
  });
  const attendedCount = modulesWithPastSession.filter((m) =>
    attendedStatuses.has(m.session!.myAttendance?.status ?? ""),
  ).length;
  const attendanceRatePercent =
    modulesWithPastSession.length === 0
      ? 0
      : Math.round((attendedCount / modulesWithPastSession.length) * 100);

  const sessionList = sessions?.sessions ?? [];
  const upcoming = sessionList
    .filter((s) => s.status === "scheduled" || s.status === "live")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];

  const aiQuota = ai?.quota ?? { used: 0, limit: 50, remaining: 50 };

  const cohortName = `Cohort ${new Date().getFullYear()}`;

  return {
    cohort: { name: cohortName, currentWeek, totalWeeks },
    metrics: {
      // Compare against the actual published module count, not the
      // max-week. Fellows see "X / N" matching the curriculum index.
      modulesComplete: { value: completed, total: totalModules },
      attendanceRatePercent,
      aiBuddyRemaining: {
        value: aiQuota.remaining,
        dailyLimit: aiQuota.limit,
      },
      capstoneStatus: mapCapstoneStatus(capstone?.capstone ?? null),
    },
    currentModule: currentModule
      ? {
          weekNumber: currentModule.weekNumber,
          title: currentModule.title,
          nextLesson: currentModule.lessons[0]?.title ?? "Start the module",
          // Progress mirrors the same completion semantics as the
          // modules-complete tile and the curriculum list:
          //   - 100% when isCompleted (covers Onboarding, attended
          //     session, or passed assessment)
          //   - 50% when there's partial progress (session attended
          //     OR assessment attempted but neither path complete)
          //   - 0% otherwise
          // Previously this only looked at assessment attempts, so a
          // fellow who attended the live session but hadn't opened
          // the quiz saw a stale 0% on the card.
          progressPercent: isCompleted(currentModule)
            ? 100
            : (currentModule.session?.myAttendance?.status != null &&
                attendedStatuses.has(currentModule.session.myAttendance.status)) ||
              currentModule.myAttempts.attemptsUsed > 0
            ? 50
            : 0,
        }
      : null,
    nextSession: upcoming
      ? {
          title: upcoming.title,
          weekNumber: upcoming.module?.weekNumber ?? 0,
          startsAt: upcoming.startsAt,
          durationMinutes: upcoming.durationMinutes,
          hostName: upcoming.host?.fullName ?? "TBD",
        }
      : null,
    recentActivity: (notifs?.notifications ?? [])
      .slice(0, 4)
      .map((n) => ({
        id: n.id,
        message: n.title,
        at: relativeTime(n.createdAt),
      })),
  };
}

async function safeJson<T>(path: string): Promise<T | null> {
  try {
    const res = await backendFetch(path, { method: "GET" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function pickCurrentModule(
  modules: BackendCurriculumModule[],
  isCompleted: (m: BackendCurriculumModule) => boolean,
): BackendCurriculumModule | null {
  // First unlocked module the fellow hasn't completed yet, falling back to
  // the highest unlocked week if everything's done. Uses the shared
  // completion predicate so Onboarding (no assessment, no attendance row)
  // doesn't keep showing up as "Continue Onboarding" forever.
  const unlocked = modules.filter((m) => m.unlocked);
  const inProgress = unlocked.find((m) => !isCompleted(m));
  return inProgress ?? unlocked[unlocked.length - 1] ?? modules[0] ?? null;
}

function mapCapstoneStatus(c: BackendCapstone): FellowHome["metrics"]["capstoneStatus"] {
  if (!c) return "Not started";
  switch (c.status) {
    case "draft":
      return "Draft";
    case "under_review":
      return "Under review";
    case "approved":
      return "Approved";
    case "needs_revision":
      return "Returned";
  }
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}
