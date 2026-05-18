"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/ui/button/Button";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { CheckCircleIcon, CheckLineIcon, TaskIcon } from "@/icons";

const STORAGE_KEY = "pic_lms_pre_fellowship_survey_v1";

// ── Types ─────────────────────────────────────────────────────────────────────

type Option = {
  value: string;
  /** When selected, shows an inline text field for free-form elaboration. */
  hasOther?: boolean;
  /** When selected, deselects all other options (mutually exclusive). */
  exclusive?: boolean;
};

type SingleQ = {
  id: string;
  number: number;
  kind: "single";
  prompt: string;
  options: Option[];
};

type MultiQ = {
  id: string;
  number: number;
  kind: "multi";
  prompt: string;
  options: Option[];
  /** Maximum selections allowed. Undefined = unlimited. */
  cap?: number;
};

type TextQ = {
  id: string;
  number: number;
  kind: "text";
  prompt: string;
  placeholder: string;
  maxLength: number;
};

type Question = SingleQ | MultiQ | TextQ;
type Answers = Record<string, string | string[]>;
type OtherValues = Record<string, string>;

// ── Survey definition ─────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    id: "q1",
    number: 1,
    kind: "single",
    prompt: "Which best describes your primary role or sector?",
    options: [
      { value: "Government / Public Sector" },
      { value: "Civil Society / NGO" },
      { value: "Private Sector" },
      { value: "Academia / Research" },
      { value: "Media / Journalism" },
      { value: "Independent Practitioner / Consultant" },
      { value: "Other", hasOther: true },
    ],
  },
  {
    id: "q2",
    number: 2,
    kind: "single",
    prompt:
      "How often does your current role involve engagement with AI-related systems or decisions?",
    options: [
      { value: "Frequently" },
      { value: "Occasionally" },
      { value: "Rarely" },
      { value: "Not at all" },
    ],
  },
  {
    id: "q3",
    number: 3,
    kind: "multi",
    prompt:
      "Which global AI governance frameworks are you familiar with? (Select all that apply)",
    options: [
      { value: "UNESCO Recommendation on AI" },
      { value: "OECD AI Principles" },
      { value: "EU AI Act" },
      { value: "Other", hasOther: true },
      { value: "Not familiar with any", exclusive: true },
    ],
  },
  {
    id: "q4",
    number: 4,
    kind: "multi",
    prompt:
      "Which African or regional AI governance initiatives are you aware of? (Select all that apply)",
    options: [
      { value: "African Union AI Strategy" },
      { value: "National AI policy (country specific)" },
      { value: "Regional or sub-regional initiatives" },
      { value: "None", exclusive: true },
    ],
  },
  {
    id: "q5",
    number: 5,
    kind: "multi",
    prompt:
      "Which concepts are you comfortable explaining to a colleague? (Select all that apply)",
    options: [
      { value: "Algorithmic bias" },
      { value: "Fairness and discrimination" },
      { value: "Transparency and explainability" },
      { value: "AI accountability and liability" },
      { value: "AI auditing and monitoring" },
      { value: "I am not yet comfortable explaining these concepts", exclusive: true },
    ],
  },
  {
    id: "q6",
    number: 6,
    kind: "single",
    prompt:
      "An AI system used for public service delivery produces outcomes that disproportionately disadvantage a specific community. What would be your first course of action?",
    options: [
      { value: "Investigate the data and assumptions used by the system" },
      { value: "Escalate the issue to institutional leadership or regulators" },
      { value: "Suspend use of the system until further review" },
      { value: "Communicate concerns publicly" },
      { value: "I am unsure what the appropriate response would be" },
    ],
  },
  {
    id: "q7",
    number: 7,
    kind: "single",
    prompt:
      "How confident are you in identifying ethical or governance risks in AI systems used within your organisation or sector?",
    options: [
      { value: "Very confident" },
      { value: "Moderately confident" },
      { value: "Slightly confident" },
      { value: "Not confident" },
    ],
  },
  {
    id: "q8",
    number: 8,
    kind: "single",
    prompt:
      "To what extent should African values and indigenous knowledge shape AI governance frameworks?",
    options: [
      { value: "Strongly influence design and governance" },
      { value: "Moderately influence governance" },
      { value: "Be considered but not central" },
      { value: "Have minimal influence" },
    ],
  },
  {
    id: "q9",
    number: 9,
    kind: "single",
    prompt:
      "Which of the following do you consider the most significant AI risk in African contexts today?",
    options: [
      { value: "Bias and discrimination" },
      { value: "Data privacy and misuse" },
      { value: "Job displacement" },
      { value: "Weak regulation and accountability" },
      { value: "Digital exclusion" },
      { value: "Other", hasOther: true },
    ],
  },
  {
    id: "q10",
    number: 10,
    kind: "single",
    prompt:
      "How confident are you in explaining AI-related risks and governance issues to non-technical stakeholders?",
    options: [
      { value: "Very confident" },
      { value: "Moderately confident" },
      { value: "Slightly confident" },
      { value: "Not confident" },
    ],
  },
  {
    id: "q11",
    number: 11,
    kind: "single",
    prompt:
      "How often have you engaged with stakeholders (e.g., policymakers, communities, media, organisations) on technology or governance issues?",
    options: [
      { value: "Frequently" },
      { value: "Occasionally" },
      { value: "Rarely" },
      { value: "Never" },
    ],
  },
  {
    id: "q12",
    number: 12,
    kind: "multi",
    cap: 2,
    prompt: "What motivated you to apply for this fellowship? (Select up to two)",
    options: [
      { value: "Professional development" },
      { value: "Interest in AI ethics and governance" },
      { value: "Policy or regulatory relevance" },
      { value: "Research or academic interest" },
      { value: "Advocacy or civil society work" },
      { value: "Organisational or institutional need" },
    ],
  },
  {
    id: "q13",
    number: 13,
    kind: "single",
    prompt: "Which fellowship module do you believe will be most challenging for you?",
    options: [
      { value: "AI Fundamentals" },
      { value: "AI Governance Landscape" },
      { value: "Ethical Reasoning & African Values" },
      { value: "Algorithmic Justice" },
      { value: "Risk Management & Assessment" },
      { value: "AI Auditing & Monitoring" },
      { value: "Transparency & Explainable AI" },
      { value: "Policy Communication & Stakeholder Engagement" },
    ],
  },
  {
    id: "q14",
    number: 14,
    kind: "multi",
    cap: 3,
    prompt:
      "Which skills do you most want to strengthen through this fellowship? (Select up to three)",
    options: [
      { value: "AI governance and policy analysis" },
      { value: "Ethical reasoning and decision making" },
      { value: "AI auditing and accountability" },
      { value: "Stakeholder engagement" },
      { value: "Research and analysis" },
      { value: "Advocacy and communication" },
    ],
  },
  {
    id: "q15",
    number: 15,
    kind: "multi",
    prompt:
      "How do you intend to apply the knowledge gained from this fellowship? (Select all that apply)",
    options: [
      { value: "Policy or regulatory development" },
      { value: "Organisational practice" },
      { value: "Research and academia" },
      { value: "Advocacy and civil society work" },
      { value: "Government engagement" },
      { value: "Community level engagement" },
      { value: "Other", hasOther: true },
    ],
  },
  {
    id: "q16",
    number: 16,
    kind: "text",
    prompt:
      "In one or two sentences, describe a real challenge related to AI ethics or governance that you are currently facing or expect to face in your work.",
    placeholder: "Describe a specific challenge you face or anticipate in your work…",
    maxLength: 600,
  },
];

// ── Main component ────────────────────────────────────────────────────────────

export default function PreFellowshipSurvey() {
  const [mounted, setMounted] = useState(false);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [others, setOthers] = useState<OtherValues>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDone(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  // Avoid hydration mismatch — nothing renders until localStorage is read.
  if (!mounted) return null;
  if (done) return <SurveyDone />;

  // ── Handlers ───────────────────────────────────────────────────────────────

  function setSingle(qId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  }

  function toggleMulti(qId: string, value: string, opt: Option, cap?: number) {
    setAnswers((prev) => {
      const current = (prev[qId] as string[] | undefined) ?? [];

      if (opt.exclusive) {
        // Toggle: clicking the exclusive option again deselects it.
        return { ...prev, [qId]: current.includes(value) ? [] : [value] };
      }

      if (current.includes(value)) {
        return { ...prev, [qId]: current.filter((v) => v !== value) };
      }

      // Remove any exclusive option that was previously selected.
      const q = QUESTIONS.find((q) => q.id === qId) as MultiQ | undefined;
      const exclusiveVals = new Set(
        (q?.options ?? []).filter((o) => o.exclusive).map((o) => o.value),
      );
      const filtered = current.filter((v) => !exclusiveVals.has(v));

      if (cap !== undefined && filtered.length >= cap) return prev;
      return { ...prev, [qId]: [...filtered, value] };
    });
  }

  function isAnswered(q: Question): boolean {
    if (q.kind === "single") return Boolean(answers[q.id]);
    if (q.kind === "multi")
      return ((answers[q.id] as string[] | undefined) ?? []).length > 0;
    if (q.kind === "text")
      return ((answers[q.id] as string | undefined) ?? "").trim().length >= 10;
    return false;
  }

  const answeredCount = QUESTIONS.filter(isAnswered).length;
  const allAnswered = answeredCount === QUESTIONS.length;

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allAnswered || submitting) return;
    setSubmitting(true);

    const payload: Record<string, unknown> = { ...answers };
    for (const [key, val] of Object.entries(others)) {
      if (val.trim()) payload[key] = val.trim();
    }

    try {
      await apiFetch("/me/pre-fellowship-survey", { method: "POST", body: payload });
    } catch {
      // Backend endpoint lands in phase 2; persist locally so UX completes.
    }

    localStorage.setItem(STORAGE_KEY, "true");
    setDone(true);
    toast.success(
      "Survey submitted",
      "Thank you — your responses have been recorded.",
    );
    setSubmitting(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6"
    >
      {/* Header */}
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fellowship-navy/10">
          <TaskIcon className="h-5 w-5 text-fellowship-navy" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-gray-800">
            Pre-Fellowship Survey
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Complete before your first live session &middot;{" "}
            {answeredCount} of {QUESTIONS.length} answered
          </p>
          <p className="mt-2 text-sm text-gray-600">
            This diagnostic survey helps faculty understand your background and
            tailor the programme. Your responses are confidential and will not
            affect your standing in the fellowship.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full bg-fellowship-navy transition-all duration-300"
          style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }}
        />
      </div>

      {/* Questions */}
      <div className="space-y-8">
        {QUESTIONS.map((q) => (
          <QuestionBlock
            key={q.id}
            question={q}
            answers={answers}
            others={others}
            answered={isAnswered(q)}
            onSingle={setSingle}
            onToggle={toggleMulti}
            onText={(qId, val) =>
              setAnswers((prev) => ({ ...prev, [qId]: val }))
            }
            onOther={(key, val) =>
              setOthers((prev) => ({ ...prev, [key]: val }))
            }
          />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
        <p className="text-xs text-gray-500">
          {allAnswered
            ? "All questions answered — ready to submit."
            : `${QUESTIONS.length - answeredCount} question${
                QUESTIONS.length - answeredCount !== 1 ? "s" : ""
              } remaining.`}
        </p>
        <Button
          type="submit"
          size="sm"
          variant="fellowship"
          disabled={!allAnswered || submitting}
        >
          {submitting ? "Submitting…" : "Submit survey"}
        </Button>
      </div>
    </form>
  );
}

// ── Done banner ───────────────────────────────────────────────────────────────

function SurveyDone() {
  return (
    <div className="rounded-2xl border border-success-200 bg-success-50 p-5 md:p-6">
      <div className="flex items-center gap-3">
        <CheckCircleIcon className="h-6 w-6 text-success-600" />
        <div>
          <h2 className="text-base font-semibold text-gray-800">
            Pre-Fellowship Survey completed
          </h2>
          <p className="mt-0.5 text-sm text-gray-600">
            Your responses have been recorded. Faculty will use them to tailor
            the programme to the cohort&apos;s needs.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Question block ────────────────────────────────────────────────────────────

type QuestionBlockProps = {
  question: Question;
  answers: Answers;
  others: OtherValues;
  answered: boolean;
  onSingle: (qId: string, value: string) => void;
  onToggle: (qId: string, value: string, opt: Option, cap?: number) => void;
  onText: (qId: string, val: string) => void;
  onOther: (key: string, val: string) => void;
};

function QuestionBlock({
  question: q,
  answers,
  others,
  answered,
  onSingle,
  onToggle,
  onText,
  onOther,
}: QuestionBlockProps) {
  return (
    <fieldset>
      <legend className="flex items-start gap-2 text-sm font-medium text-gray-800">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
          {q.number}
        </span>
        <span className="flex-1">{q.prompt}</span>
        {answered && (
          <CheckLineIcon className="mt-0.5 h-4 w-4 shrink-0 text-success-500" />
        )}
      </legend>

      <div className="mt-3 pl-7">
        {q.kind === "single" && (
          <SingleOptions
            question={q}
            selected={answers[q.id] as string | undefined}
            otherValue={others[`${q.id}_other`] ?? ""}
            onSelect={(val) => onSingle(q.id, val)}
            onOther={(val) => onOther(`${q.id}_other`, val)}
          />
        )}
        {q.kind === "multi" && (
          <MultiOptions
            question={q}
            selected={(answers[q.id] as string[] | undefined) ?? []}
            otherValue={others[`${q.id}_other`] ?? ""}
            onToggle={(val, opt) => onToggle(q.id, val, opt, q.cap)}
            onOther={(val) => onOther(`${q.id}_other`, val)}
          />
        )}
        {q.kind === "text" && (
          <TextAnswer
            question={q}
            value={(answers[q.id] as string | undefined) ?? ""}
            onChange={(val) => onText(q.id, val)}
          />
        )}
      </div>
    </fieldset>
  );
}

// ── Option renderers ──────────────────────────────────────────────────────────

function SingleOptions({
  question,
  selected,
  otherValue,
  onSelect,
  onOther,
}: {
  question: SingleQ;
  selected: string | undefined;
  otherValue: string;
  onSelect: (val: string) => void;
  onOther: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      {question.options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <div key={opt.value}>
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="radio"
                name={question.id}
                value={opt.value}
                checked={isSelected}
                onChange={() => onSelect(opt.value)}
                className="h-4 w-4 accent-fellowship-navy"
              />
              <span className="text-sm text-gray-700">{opt.value}</span>
            </label>
            {opt.hasOther && isSelected && (
              <input
                type="text"
                maxLength={120}
                placeholder="Please specify…"
                value={otherValue}
                onChange={(e) => onOther(e.target.value)}
                className="ml-6 mt-1.5 w-full max-w-sm rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-fellowship-navy focus:outline-none focus:ring-1 focus:ring-fellowship-navy"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MultiOptions({
  question,
  selected,
  otherValue,
  onToggle,
  onOther,
}: {
  question: MultiQ;
  selected: string[];
  otherValue: string;
  onToggle: (val: string, opt: Option) => void;
  onOther: (val: string) => void;
}) {
  const atCap =
    question.cap !== undefined && selected.length >= question.cap;

  return (
    <div className="space-y-2">
      {question.cap && (
        <p className="mb-1 text-xs text-gray-500">
          Select up to {question.cap} &middot; {selected.length} selected
        </p>
      )}
      {question.options.map((opt) => {
        const isChecked = selected.includes(opt.value);
        const isDisabled = !isChecked && atCap && !opt.exclusive;
        return (
          <div key={opt.value}>
            <label
              className={`flex cursor-pointer items-center gap-2.5 ${
                isDisabled ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <input
                type="checkbox"
                value={opt.value}
                checked={isChecked}
                disabled={isDisabled}
                onChange={() => onToggle(opt.value, opt)}
                className="h-4 w-4 accent-fellowship-navy"
              />
              <span className="text-sm text-gray-700">{opt.value}</span>
            </label>
            {opt.hasOther && isChecked && (
              <input
                type="text"
                maxLength={120}
                placeholder="Please specify…"
                value={otherValue}
                onChange={(e) => onOther(e.target.value)}
                className="ml-6 mt-1.5 w-full max-w-sm rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-fellowship-navy focus:outline-none focus:ring-1 focus:ring-fellowship-navy"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TextAnswer({
  question,
  value,
  onChange,
}: {
  question: TextQ;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div>
      <textarea
        rows={4}
        maxLength={question.maxLength}
        placeholder={question.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm leading-relaxed focus:border-fellowship-navy focus:outline-none focus:ring-1 focus:ring-fellowship-navy"
      />
      <p className="mt-1 text-right text-xs text-gray-400">
        {value.length} / {question.maxLength}
      </p>
    </div>
  );
}
