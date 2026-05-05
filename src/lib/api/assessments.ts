/**
 * Assessments — admin overview types (BRD §6.5). The list/detail
 * endpoints aren't aggregated on the backend yet; faculty manage
 * assessments via `/faculty/modules/[id]`. Reads on this surface return
 * empty until a `/assessments` admin endpoint lands.
 */

export type QuestionType = "mcq"| "truefalse"| "short";

export type Assessment = {
  id: string;
  courseId: string;
  courseTitle: string;
  /** Linked module id, or null for cross-module assessments. */
  moduleId: string | null;
  moduleTitle: string | null;
  /** Week number of the linked module, or null. */
  weekNumber: number | null;
  title: string;
  description: string;
  totalPoints: number;
  /** % required to pass. */
  passMark: number;
  /** Minutes allowed, or null for untimed. */
  timeLimitMinutes: number | null;
  questionCount: number;
  /** How many fellows have attempted (latest attempt counted). */
  attemptsCount: number;
  /** How many of those attempts passed. */
  passedCount: number;
  isPublished: boolean;
  /** True if any submitted attempts have ungraded short-answer questions. */
  awaitingGrading: number;
  createdAt: string;
  updatedAt: string;
};

export async function getAssessments(): Promise<Assessment[]> {
  return [];
}

/* ---------- Detail: questions + submissions (BRD §6.5) ---------- */

export type Question = {
  id: string;
  assessmentId: string;
  type: QuestionType;
  questionText: string;
  /** MCQ options. Empty for true/false and short-answer. */
  options: string[];
  /** MCQ: index of correct option. True/false: "true"/"false". Short: model answer used as grader hint. */
  correctAnswer: string;
  explanation: string;
  points: number;
  orderIndex: number;
};

export type ShortAnswerGrade = {
  questionId: string;
  questionText: string;
  fellowAnswer: string;
  /** Points awarded out of maxPoints. Null if not yet graded. */
  pointsAwarded: number | null;
  maxPoints: number;
  feedback: string | null;
};

export type SubmissionStatus =
  | "passed"
  | "failed"
  | "pending-grading"
  | "in-progress";

export type Submission = {
  id: string;
  assessmentId: string;
  fellowId: string;
  fellowName: string;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  status: SubmissionStatus;
  /** Short-answer details. Empty if assessment has no short-answer questions. */
  shortAnswers: ShortAnswerGrade[];
  timeTakenSeconds: number;
};

export type AssessmentDetail = Assessment & {
  questions: Question[];
  submissions: Submission[];
};

export async function getAssessment(
  _id: string,
): Promise<AssessmentDetail | null> {
  return null;
}
