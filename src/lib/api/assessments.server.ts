/**
 * Server-only admin assessments fetcher (BRD §6.5). Aggregates the backend
 * `/assessments` and `/assessments/:id` payloads into the existing
 * `Assessment` / `AssessmentDetail` shapes the admin pages render.
 */
import "server-only";
import { cache } from "react";
import { backendFetch } from "./backend";
import type {
  Assessment,
  AssessmentDetail,
  Question,
  ShortAnswerGrade,
  Submission,
  SubmissionStatus,
} from "./assessments";

type BackendAssessmentRow = {
  id: string;
  module: {
    id: string;
    title: string;
    weekNumber: number;
    status: "draft" | "in_review" | "published";
    course: { id: string; title: string };
  };
  title: string;
  passingScore: number;
  timeLimitMinutes: number;
  attemptsAllowed: number;
  questionCount: number;
  attemptsCount: number;
  passedCount: number;
  awaitingGrading: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type BackendChoice = { id: string; text: string; isCorrect: boolean };

type BackendQuestion = {
  id: string;
  assessmentId: string;
  kind: "multiple_choice" | "short_text" | "essay" | "attachment";
  prompt: string;
  choices: BackendChoice[];
  maxLength: number | null;
  orderIndex: number;
};

type BackendAnswer = {
  id: string;
  questionId: string;
  questionPrompt: string;
  choiceId: string | null;
  text: string | null;
  fileName: string | null;
  fileUrl: string | null;
  fileMimeType: string | null;
  fileBytes: number | null;
  score: number | null;
  feedback: string | null;
};

type BackendDetailedAttempt = {
  id: string;
  fellow: { id: string; fullName: string };
  status: "passed" | "failed" | "pending_review";
  score: number | null;
  startedAt: string;
  submittedAt: string;
  gradedAt: string | null;
  answers: BackendAnswer[];
};

/**
 * Detail response — note that the backend's `GET /assessments/:id`
 * doesn't currently return the aggregate counts (`questionCount`,
 * `attemptsCount`, `passedCount`, `awaitingGrading`, `isPublished`)
 * that the list endpoint includes. We compute those locally in
 * `mapDetail` from the questions + attempts arrays we DO get back.
 *
 * If the backend ever ships those fields on the detail payload too,
 * `mapDetail` will preserve them via `Object.assign({}, ...)` — but
 * the local computation gives a correct result either way and keeps
 * the header tiles from showing `undefined / NaN%`.
 */
type BackendAssessmentDetail = Omit<
  BackendAssessmentRow,
  | "questionCount"
  | "attemptsCount"
  | "passedCount"
  | "awaitingGrading"
  | "isPublished"
> & {
  questionCount?: number;
  attemptsCount?: number;
  passedCount?: number;
  awaitingGrading?: number;
  isPublished?: boolean;
  questions: BackendQuestion[];
  attempts: BackendDetailedAttempt[];
};

export async function getAssessmentsServer(): Promise<Assessment[]> {
  try {
    const res = await backendFetch("/assessments", { method: "GET" });
    if (!res.ok) return [];
    const data = (await res.json()) as { assessments: BackendAssessmentRow[] };
    return (data.assessments ?? []).map(mapRow);
  } catch {
    return [];
  }
}

export const getAssessmentServer = cache(async (
  id: string,
): Promise<AssessmentDetail | null> => {
  try {
    const res = await backendFetch(`/assessments/${encodeURIComponent(id)}`, {
      method: "GET",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { assessment: BackendAssessmentDetail };
    return mapDetail(data.assessment);
  } catch {
    return null;
  }
});

function mapRow(r: BackendAssessmentRow): Assessment {
  // Total points isn't precomputed yet — questionCount × default points (1)
  // is a safe lower-bound; the detail view recomputes from real questions.
  return {
    id: r.id,
    courseId: r.module.course.id,
    courseTitle: r.module.course.title,
    moduleId: r.module.id,
    moduleTitle: r.module.title,
    weekNumber: r.module.weekNumber,
    title: r.title,
    description: "",
    totalPoints: r.questionCount,
    passMark: r.passingScore,
    timeLimitMinutes: r.timeLimitMinutes,
    questionCount: r.questionCount,
    attemptsCount: r.attemptsCount,
    passedCount: r.passedCount,
    isPublished: r.isPublished,
    awaitingGrading: r.awaitingGrading,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function mapDetail(d: BackendAssessmentDetail): AssessmentDetail {
  const questions: Question[] = d.questions.map((q) => ({
    id: q.id,
    assessmentId: q.assessmentId,
    type:
      q.kind === "multiple_choice"
        ? "mcq"
        : q.kind === "short_text"
        ? "short"
        : "short",
    questionText: q.prompt,
    options: q.choices.map((c) => c.text),
    correctAnswer:
      q.kind === "multiple_choice"
        ? String(q.choices.findIndex((c) => c.isCorrect))
        : "",
    explanation: "",
    points: 1,
    orderIndex: q.orderIndex,
  }));

  const totalPoints = questions.length;

  const submissions: Submission[] = d.attempts.map((a) => {
    const shortAnswers: ShortAnswerGrade[] = a.answers
      .filter((ans) => ans.choiceId === null)
      .map((ans) => ({
        questionId: ans.questionId,
        questionText: ans.questionPrompt,
        fellowAnswer: ans.text ?? ans.fileName ?? "",
        pointsAwarded: ans.score,
        maxPoints: 1,
        feedback: ans.feedback,
      }));

    const status: SubmissionStatus =
      a.status === "passed"
        ? "passed"
        : a.status === "pending_review"
        ? "pending-grading"
        : "failed";

    const startedMs = new Date(a.startedAt).getTime();
    const submittedMs = new Date(a.submittedAt).getTime();

    return {
      id: a.id,
      assessmentId: d.id,
      fellowId: a.fellow.id,
      fellowName: a.fellow.fullName,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      score: a.score,
      status,
      shortAnswers,
      timeTakenSeconds: Math.max(
        0,
        Math.floor((submittedMs - startedMs) / 1000),
      ),
    };
  });

  // Compute the aggregate counts here — the backend's detail endpoint
  // doesn't return them, but we have everything we need. Falls through
  // to the backend's value when it ever does ship them.
  const attemptsCount = d.attemptsCount ?? d.attempts.length;
  const passedCount =
    d.passedCount ?? d.attempts.filter((a) => a.status === "passed").length;
  const awaitingGrading =
    d.awaitingGrading ??
    d.attempts.filter((a) => a.status === "pending_review").length;
  const questionCount = d.questionCount ?? d.questions.length;
  // `isPublished` isn't surfaced on the detail payload either; derive
  // from the module status the backend DOES return.
  const isPublished = d.isPublished ?? d.module.status === "published";

  return {
    ...mapRow({
      ...d,
      questionCount,
      attemptsCount,
      passedCount,
      awaitingGrading,
      isPublished,
    } as BackendAssessmentRow),
    totalPoints,
    questions,
    submissions,
  };
}
