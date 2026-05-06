"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/SelectField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, ChevronRightIcon } from "@/icons";
import { ApiError } from "@/lib/api/client";
import { updateMyProfile } from "@/lib/api/profile";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

type Sector = "Healthcare" | "EdTech" | "Agriculture" | "Economic Inclusion Development";

const SECTORS: { value: Sector; description: string }[] = [
  { value: "Healthcare", description: "Diagnostics, hospital ops, public health" },
  { value: "EdTech", description: "Learning tools, accessibility, assessment" },
  { value: "Agriculture", description: "Yield, supply chains, climate adaptation" },
  { value: "Economic Inclusion Development", description: "Fintech, credit, financial inclusion, governance, public policy" },
];

const COUNTRIES = [
  "Nigeria", "Kenya", "South Africa", "Ghana", "Ethiopia",
  "Egypt", "Morocco", "Tanzania", "Uganda", "Rwanda",
  "Senegal", "Côte d'Ivoire", "Cameroon", "Zambia", "Zimbabwe",
  "Other",
];

type WizardData = {
  country: string;
  organisation: string;
  jobTitle: string;
  sector: Sector | "";
  bio: string;
  linkedinUrl: string;
  goals: string;
  notifyInApp: boolean;
  notifyEmail: boolean;
};

const STEPS = [
  { number: 1, title: "About you" },
  { number: 2, title: "Your work" },
  { number: 3, title: "Goals & preferences" },
  { number: 4, title: "Review" },
];

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<WizardData>({
    country: "",
    organisation: "",
    jobTitle: "",
    sector: "",
    bio: "",
    linkedinUrl: "",
    goals: "",
    notifyInApp: true,
    notifyEmail: true,
  });

  const update = <K extends keyof WizardData>(key: K, value: WizardData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const canProceed =
    step === 1
      ? data.country && data.organisation && data.jobTitle
      : step === 2
      ? data.sector && data.bio.trim().length >= 20
      : step === 3
      ? data.goals.trim().length >= 20
      : true;

  const onFinish = async () => {
    setSubmitting(true);
    // Combine bio with goals so the goals copy is preserved without needing
    // a new column. Notification preferences aren't on the user table yet
    // (see profile.server.ts) so they're collected here for UX consistency
    // and persisted once the backend grows them.
    const composedBio = data.goals
      ? `${data.bio.trim()}\n\nGoals: ${data.goals.trim()}`
      : data.bio.trim();
    try {
      await updateMyProfile({
        country: data.country,
        organisation: data.organisation,
        jobTitle: data.jobTitle,
        sector: data.sector || "Economic Inclusion Development",
        bio: composedBio,
        linkedinUrl: data.linkedinUrl ? data.linkedinUrl : null,
      });
      router.push("/home");
      router.refresh();
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiError && err.status === 401) {
        toast.error(
          "Session expired",
          "Please apply again to start a new session.",
        );
        router.push("/signin#register");
        return;
      }
      toast.errorFromException("Couldn't save your profile", err);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full h-full overflow-y-auto custom-scrollbar px-6 py-8 sm:px-10">
      <div className="w-full max-w-md mx-auto">
        <button
          type="button"
          onClick={() => (step === 1 ? router.push("/signin#register") : setStep((s) => s - 1))}
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ChevronLeftIcon />
          {step === 1 ? "Back to apply" : "Back"}
        </button>
      </div>

      <div className="flex flex-col flex-1 w-full max-w-md mx-auto pt-6">
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-fellowship-navy">
            Step {step} of {STEPS.length} · {STEPS[step - 1].title}
          </p>
          <ProgressBar current={step} total={STEPS.length} />
        </div>

        <div className="flex-1">
          {step === 1 && <AboutYouStep data={data} update={update} />}
          {step === 2 && <YourWorkStep data={data} update={update} />}
          {step === 3 && <GoalsStep data={data} update={update} />}
          {step === 4 && <ReviewStep data={data} />}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button
              size="md"
              variant="outline"
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
          ) : (
            <span />
          )}

          {step < STEPS.length ? (
            <Button
              size="md"
              variant="fellowship"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed}
              className="ml-auto"
            >
              Continue
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="md"
              variant="fellowship"
              onClick={onFinish}
              disabled={submitting}
              className="ml-auto"
            >
              {submitting ? "Finishing…" : "Finish & enter Fellowship"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = (current / total) * 100;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-full bg-fellowship-navy transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

type StepProps = {
  data: WizardData;
  update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
};

function AboutYouStep({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-bold text-gray-800 text-title-sm sm:text-title-md">
          Tell us about you
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Where you&apos;re based and what you do day-to-day.
        </p>
      </div>

      <div>
        <Label>
          Country <span className="text-error-500">*</span>
        </Label>
        <SelectField
          value={data.country}
          onChange={(v) => update("country", v)}
          options={COUNTRIES.map((c) => ({ value: c, label: c }))}
          placeholder="Select your country"
        />
      </div>

      <div>
        <Label>
          Organisation <span className="text-error-500">*</span>
        </Label>
        <Input
          placeholder="e.g. Ministry of Health, Andela, Independent"
          type="text"
          defaultValue={data.organisation}
          onChange={(e) => update("organisation", e.target.value)}
        />
      </div>

      <div>
        <Label>
          Job title <span className="text-error-500">*</span>
        </Label>
        <Input
          placeholder="e.g. Policy Analyst, ML Engineer"
          type="text"
          defaultValue={data.jobTitle}
          onChange={(e) => update("jobTitle", e.target.value)}
        />
      </div>
    </div>
  );
}

function YourWorkStep({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-bold text-gray-800 text-title-sm sm:text-title-md">
          Your sector & background
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Helps us match you with the right mentor and capstone scope.
        </p>
      </div>

      <div>
        <Label>
          Primary sector <span className="text-error-500">*</span>
        </Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SECTORS.map((s) => {
            const selected = data.sector === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => update("sector", s.value)}
                className={`flex flex-col items-start rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  selected
                    ? "border-fellowship-navy bg-fellowship-navy/5 ring-1 ring-fellowship-navy/30"
                    : "border-gray-200 bg-white hover:border-fellowship-navy/30 hover:bg-gray-50"
                }`}
              >
                <span className="text-sm font-semibold text-gray-800">{s.value}</span>
                <span className="text-xs text-gray-500">{s.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>
          Short bio <span className="text-error-500">*</span>
        </Label>
        <textarea
          rows={4}
          maxLength={400}
          placeholder="A couple of sentences on what you work on and why ethics & governance matters to you."
          value={data.bio}
          onChange={(e) => update("bio", e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
        />
        <p className="mt-1 text-xs text-gray-400">
          {data.bio.length}/400 · minimum 20 characters
        </p>
      </div>

      <div>
        <Label>LinkedIn URL (optional)</Label>
        <Input
          placeholder="https://linkedin.com/in/…"
          type="url"
          defaultValue={data.linkedinUrl}
          onChange={(e) => update("linkedinUrl", e.target.value)}
        />
      </div>
    </div>
  );
}

function GoalsStep({ data, update }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-bold text-gray-800 text-title-sm sm:text-title-md">
          Goals & preferences
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          What you want from the Fellowship, and how you want to be reached.
        </p>
      </div>

      <div>
        <Label>
          What do you want from the Fellowship? <span className="text-error-500">*</span>
        </Label>
        <textarea
          rows={4}
          maxLength={500}
          placeholder="e.g. Build practical skills in AI auditing, contribute to policy in my country, find collaborators for my capstone."
          value={data.goals}
          onChange={(e) => update("goals", e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10"
        />
        <p className="mt-1 text-xs text-gray-400">
          {data.goals.length}/500 · minimum 20 characters
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="mb-3 text-sm font-semibold text-gray-800">
          How should we reach you?
        </p>
        <div className="space-y-2.5">
          <Checkbox
            checked={data.notifyInApp}
            onChange={(v) => update("notifyInApp", v)}
            label="In-app notifications"
          />
          <Checkbox
            checked={data.notifyEmail}
            onChange={(v) => update("notifyEmail", v)}
            label="Email (session reminders, capstone feedback, milestones)"
          />
        </div>
        <p className="mt-3 text-xs text-gray-500">
          You can change these any time in Settings.
        </p>
      </div>
    </div>
  );
}

function ReviewStep({ data }: { data: WizardData }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-bold text-gray-800 text-title-sm sm:text-title-md">
          One last look
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Confirm and you&apos;re officially in Cohort 2026.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <ReviewRow label="Country" value={data.country} />
        <ReviewRow label="Organisation" value={data.organisation} />
        <ReviewRow label="Job title" value={data.jobTitle} />
        <ReviewRow label="Sector" value={data.sector || "—"} />
        <ReviewRow label="Bio" value={data.bio} multiline />
        {data.linkedinUrl && <ReviewRow label="LinkedIn" value={data.linkedinUrl} />}
        <ReviewRow label="Goals" value={data.goals} multiline />
        <ReviewRow
          label="Notifications"
          value={[
            data.notifyInApp ? "In-app" : null,
            data.notifyEmail ? "Email" : null,
          ]
            .filter(Boolean)
            .join(", ") || "None"}
        />
      </div>

      <p className="text-xs text-gray-500">
        Finishing here saves your profile and takes you to your fellow home.
      </p>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span
        className={`text-right text-sm text-gray-800 ${
          multiline ? "max-w-[60%]" : "max-w-[60%] truncate"
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );
}
