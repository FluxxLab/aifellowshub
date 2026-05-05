"use client";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { ChevronDownIcon, PlusIcon } from "@/icons";
import { cn } from "@/lib/utils";
import type {
 AssessmentDetail,
 Question,
 ShortAnswerGrade,
 Submission,
 SubmissionStatus,
} from "@/lib/api/assessments";

const TABS = [
 { id:"questions", label:"Questions"},
 { id:"submissions", label:"Submissions"},
] as const;
type TabId = (typeof TABS)[number]["id"];

type AssessmentDetailBodyProps = {
 assessment: AssessmentDetail;
};

export default function AssessmentDetailBody({
 assessment,
}: AssessmentDetailBodyProps) {
 const router = useRouter();
 const params = useSearchParams();
 const initialTab: TabId =
 params.get("tab") ==="submissions"||
 (params.get("tab") === null && assessment.awaitingGrading > 0)
 ?"submissions":"questions";

 const [tab, setTab] = useState<TabId>(initialTab);

 // Local state — phase 1 grading is mocked; phase 2 will PATCH /submissions/:id/grade.
 const [submissions, setSubmissions] = useState<Submission[]>(
 assessment.submissions
 );

 useEffect(() => {
 const url = new URL(window.location.href);
 url.searchParams.set("tab", tab);
 router.replace(url.pathname + url.search, { scroll: false });
 }, [tab, router]);

 const onGrade = (
 submissionId: string,
 questionId: string,
 pointsAwarded: number,
 feedback: string
 ) => {
 setSubmissions((prev) =>
 prev.map((s) => {
 if (s.id !== submissionId) return s;
 const newAnswers = s.shortAnswers.map((sa) =>
 sa.questionId === questionId
 ? { ...sa, pointsAwarded, feedback }
 : sa
 );
 const allGraded = newAnswers.every((sa) => sa.pointsAwarded !== null);
 const status: SubmissionStatus = allGraded
 ? // Recompute pass/fail when all short-answers are graded.
 computeFinalStatus(s, newAnswers, assessment)
 :"pending-grading";
 const score = allGraded
 ? newAnswers.reduce((sum, sa) => sum + (sa.pointsAwarded ?? 0), 0) +
 (s.score ?? 0) // base score retained from auto-grading
 : null;
 return { ...s, shortAnswers: newAnswers, status, score };
 })
 );
 };

 const pendingCount = submissions.filter(
 (s) => s.status ==="pending-grading").length;

 return (
 <section className="rounded-2xl border border-gray-200 bg-white">
 <div className="flex items-center gap-1 border-b border-gray-100 px-5 sm:px-6">
 {TABS.map((t) => {
 const active = tab === t.id;
 const count =
 t.id ==="questions"? assessment.questions.length
 : submissions.length;
 return (
 <button
 key={t.id}
 role="tab" aria-selected={active}
 onClick={() => setTab(t.id)}
 className={cn("relative -mb-px flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors",
 active
 ?"border-b-2 border-fellowship-navy text-fellowship-navy":"border-b-2 border-transparent text-gray-500 hover:text-gray-700")}
 >
 {t.label}
 <span
 className={cn("rounded-full px-2 py-0.5 text-xs font-medium",
 active
 ?"bg-fellowship-navy text-white":"bg-gray-100 text-gray-600")}
 >
 {count}
 </span>
 {t.id ==="submissions"&& pendingCount > 0 && !active && (
 <span className="rounded-full bg-error-100 px-2 py-0.5 text-xs font-bold text-error-700">
 {pendingCount} pending
 </span>
 )}
 </button>
 );
 })}
 </div>

 {tab ==="questions"? (
 <QuestionsPanel assessment={assessment} />
 ) : (
 <SubmissionsPanel submissions={submissions} onGrade={onGrade} />
 )}
 </section>
 );
}

function computeFinalStatus(
 s: Submission,
 shortAnswers: ShortAnswerGrade[],
 a: AssessmentDetail
): SubmissionStatus {
 const totalAwarded =
 (s.score ?? 0) +
 shortAnswers.reduce((sum, sa) => sum + (sa.pointsAwarded ?? 0), 0);
 const pct = (totalAwarded / a.totalPoints) * 100;
 return pct >= a.passMark ?"passed":"failed";
}

/* ---------- Questions tab ---------- */

function QuestionsPanel({ assessment }: { assessment: AssessmentDetail }) {
 // The full question editor lives at the faculty module editor —
 // admins are routed there to add/remove/reorder questions instead
 // of duplicating that surface here. Admin (faculty)/layout permits
 // this access. If the assessment isn't tied to a module (which
 // shouldn't happen for current data, but the type allows it), the
 // edit links are disabled with an explanatory tooltip.
 const editorHref = assessment.moduleId
   ? `/faculty/modules/${encodeURIComponent(assessment.moduleId)}`
   : null;

 const AddButton = () =>
 editorHref ? (
 <Link href={editorHref}>
 <Button variant="fellowship" size="sm" startIcon={<PlusIcon />}>
 Add question
 </Button>
 </Link>
 ) : (
 <span title="This assessment isn't linked to a module.">
 <Button
 variant="fellowship"
 size="sm"
 startIcon={<PlusIcon />}
 disabled
 >
 Add question
 </Button>
 </span>
 );

 if (assessment.questions.length === 0) {
 return (
 <div className="px-6 py-12 text-center">
 <p className="text-sm text-gray-500">
 No questions yet. Add the first one to get started.
 </p>
 <div className="mt-4 inline-block">
 <AddButton />
 </div>
 </div>
 );
 }

 return (
 <div>
 <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
 <p className="text-sm text-gray-500">
 {assessment.questions.length} questions ·{" "}
 {assessment.totalPoints} points total
 </p>
 <AddButton />
 </div>
 <ol className="flex flex-col">
 {assessment.questions.map((q) => (
 <QuestionRow key={q.id} question={q} />
 ))}
 </ol>
 </div>
 );
}

function QuestionRow({ question }: { question: Question }) {
 const [expanded, setExpanded] = useState(false);

 return (
 <li className="border-b border-gray-100 last:border-b-0">
 <button
 type="button" onClick={() => setExpanded((v) => !v)}
 className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 sm:px-6" aria-expanded={expanded}
 >
 <span className="mt-0.5 text-xs font-semibold tabular-nums text-fellowship-navy">
 Q{String(question.orderIndex + 1).padStart(2,"0")}
 </span>
 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <QuestionTypeBadge type={question.type} />
 <span className="text-xs text-gray-500 tabular-nums">
 {question.points} {question.points === 1 ?"pt":"pts"}
 </span>
 </div>
 <p className="mt-1 text-sm text-gray-800">
 {question.questionText}
 </p>
 </div>
 <ChevronDownIcon
 className={cn("mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform",
 expanded &&"rotate-180")}
 />
 </button>

 {expanded && (
 <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 sm:px-6">
 {question.type ==="mcq"&& (
 <ul className="flex flex-col gap-2">
 {question.options.map((opt, i) => {
 const isCorrect = String(i) === question.correctAnswer;
 return (
 <li
 key={i}
 className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
 isCorrect
 ?"border-success-200 bg-success-50 text-success-700":"border-gray-200 bg-white text-gray-700")}
 >
 <span className="font-mono text-xs font-semibold">
 {String.fromCharCode(65 + i)}
 </span>
 <span className="flex-1">{opt}</span>
 {isCorrect && (
 <span className="text-xs font-semibold uppercase">
 Correct
 </span>
 )}
 </li>
 );
 })}
 </ul>
 )}
 {question.type ==="truefalse"&& (
 <p className="text-sm text-gray-700">
 Correct answer:{" "}
 <span className="font-semibold capitalize text-success-700">
 {question.correctAnswer}
 </span>
 </p>
 )}
 {question.type ==="short"&& (
 <p className="text-sm italic text-gray-600">
 Short-answer · graded manually. Hint to graders:{" "}
 <span className="not-italic text-gray-700">
 {question.correctAnswer}
 </span>
 </p>
 )}
 {question.explanation && (
 <p className="mt-3 text-xs text-gray-500">
 <span className="font-semibold">Explanation: </span>
 {question.explanation}
 </p>
 )}
 <div className="mt-4 flex gap-2">
 <Button variant="outline" size="sm">
 Edit
 </Button>
 <Button variant="outline" size="sm">
 Delete
 </Button>
 </div>
 </div>
 )}
 </li>
 );
}

function QuestionTypeBadge({ type }: { type: Question["type"] }) {
 if (type ==="mcq") return <Badge color="info">MCQ</Badge>;
 if (type ==="truefalse") return <Badge color="info">True/False</Badge>;
 return <Badge color="warning">Short answer</Badge>;
}

/* ---------- Submissions tab ---------- */

const SUB_FILTERS: { id:"all"| SubmissionStatus; label: string }[] = [
 { id:"all", label:"All"},
 { id:"pending-grading", label:"Pending grading"},
 { id:"passed", label:"Passed"},
 { id:"failed", label:"Failed"},
];

function SubmissionsPanel({
 submissions,
 onGrade,
}: {
 submissions: Submission[];
 onGrade: (
 submissionId: string,
 questionId: string,
 pointsAwarded: number,
 feedback: string
 ) => void;
}) {
 const [filter, setFilter] = useState<(typeof SUB_FILTERS)[number]["id"]>("all");
 const [search, setSearch] = useState("");

 const visible = useMemo(() => {
 const q = search.trim().toLowerCase();
 return submissions.filter((s) => {
 if (filter !=="all"&& s.status !== filter) return false;
 if (q && !s.fellowName.toLowerCase().includes(q)) return false;
 return true;
 });
 }, [submissions, filter, search]);

 if (submissions.length === 0) {
 return (
 <div className="px-6 py-12 text-center text-sm text-gray-500">
 No submissions yet.
 </div>
 );
 }

 return (
 <div>
 <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
 <input
 type="search" value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search fellows…" className="h-10 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-none focus:ring-3 focus:ring-fellowship-navy/10 sm:max-w-xs"/>
 <div className="flex flex-wrap gap-2">
 {SUB_FILTERS.map((f) => (
 <button
 key={f.id}
 onClick={() => setFilter(f.id)}
 className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
 filter === f.id
 ?"bg-fellowship-navy text-white":"border border-gray-200 bg-white text-gray-600 hover:bg-gray-50")}
 >
 {f.label}
 </button>
 ))}
 </div>
 </div>

 {visible.length === 0 ? (
 <div className="px-6 py-12 text-center text-sm text-gray-500">
 No submissions match.
 </div>
 ) : (
 <ul className="flex flex-col">
 {visible.map((s) => (
 <SubmissionRow key={s.id} submission={s} onGrade={onGrade} />
 ))}
 </ul>
 )}
 </div>
 );
}

function SubmissionRow({
 submission,
 onGrade,
}: {
 submission: Submission;
 onGrade: (
 submissionId: string,
 questionId: string,
 pointsAwarded: number,
 feedback: string
 ) => void;
}) {
 const expandable = submission.shortAnswers.length > 0;
 const [expanded, setExpanded] = useState(
 submission.status ==="pending-grading"&& expandable
 );

 return (
 <li className="border-b border-gray-100 last:border-b-0">
 <button
 type="button" onClick={() => expandable && setExpanded((v) => !v)}
 className={cn("flex w-full items-center gap-3 px-5 py-3 text-left transition-colors sm:px-6",
 expandable &&"hover:bg-gray-50")}
 aria-expanded={expandable ? expanded : undefined}
 >
 <AvatarText name={submission.fellowName} className="h-9 w-9"/>
 <div className="min-w-0 flex-1">
 <span className="block text-sm font-semibold text-gray-800">
 {submission.fellowName}
 </span>
 <span className="mt-0.5 block text-xs text-gray-500">
 Submitted {relative(submission.submittedAt)} ·{" "}
 {Math.round(submission.timeTakenSeconds / 60)} min
 </span>
 </div>
 <div className="flex items-center gap-3">
 {submission.score !== null && (
 <span className="text-sm font-semibold tabular-nums text-gray-700">
 {submission.score} pts
 </span>
 )}
 <SubmissionStatusBadge status={submission.status} />
 {expandable && (
 <ChevronDownIcon
 className={cn("h-4 w-4 text-gray-400 transition-transform",
 expanded &&"rotate-180")}
 />
 )}
 </div>
 </button>

 {expandable && expanded && (
 <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 sm:px-6">
 <ol className="flex flex-col gap-4">
 {submission.shortAnswers.map((sa) => (
 <ShortAnswerGradeBlock
 key={sa.questionId}
 grade={sa}
 onSave={(points, feedback) =>
 onGrade(submission.id, sa.questionId, points, feedback)
 }
 />
 ))}
 </ol>
 </div>
 )}
 </li>
 );
}

function ShortAnswerGradeBlock({
 grade,
 onSave,
}: {
 grade: ShortAnswerGrade;
 onSave: (points: number, feedback: string) => void;
}) {
 const [points, setPoints] = useState<number>(
 grade.pointsAwarded ?? grade.maxPoints
 );
 const [feedback, setFeedback] = useState<string>(grade.feedback ??"");
 const [saved, setSaved] = useState<boolean>(grade.pointsAwarded !== null);

 return (
 <li className="rounded-xl border border-gray-200 bg-white p-4">
 <p className="text-sm font-semibold text-gray-800">
 {grade.questionText}
 </p>
 <p className="mt-2 whitespace-pre-wrap rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
 {grade.fellowAnswer}
 </p>

 <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_auto]">
 <div>
 <label className="block text-xs font-medium uppercase tracking-wider text-gray-400">
 Points (of {grade.maxPoints})
 </label>
 <input
 type="number" min={0}
 max={grade.maxPoints}
 value={points}
 onChange={(e) => {
 setPoints(Number(e.target.value));
 setSaved(false);
 }}
 className="mt-1 h-10 w-24 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm tabular-nums text-gray-800 focus:border-fellowship-navy focus:outline-none focus:ring-3 focus:ring-fellowship-navy/10"/>
 </div>
 <div>
 <label className="block text-xs font-medium uppercase tracking-wider text-gray-400">
 Feedback (optional)
 </label>
 <input
 type="text" value={feedback}
 onChange={(e) => {
 setFeedback(e.target.value);
 setSaved(false);
 }}
 placeholder="One-line note for the fellow…" className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-none focus:ring-3 focus:ring-fellowship-navy/10"/>
 </div>
 <div className="flex items-end">
 <Button
 variant="fellowship" size="sm" onClick={() => {
 onSave(points, feedback);
 setSaved(true);
 }}
 disabled={saved}
 >
 {saved ?"Saved":"Save grade"}
 </Button>
 </div>
 </div>
 </li>
 );
}

function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
 if (status ==="passed") return <Badge color="success">Passed</Badge>;
 if (status ==="failed") return <Badge color="error">Failed</Badge>;
 if (status ==="pending-grading")
 return <Badge color="warning">Pending grading</Badge>;
 return <Badge color="info">In progress</Badge>;
}

function relative(iso: string | null): string {
 if (!iso) return "—";
 const days = Math.round(
 (Date.now() - new Date(iso).getTime()) / 86_400_000
 );
 if (days <= 0) return "today";
 if (days === 1) return "yesterday";
 return `${days}d ago`;
}
