"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button/Button";
import { toast } from "@/lib/toast";
import CodeOfConductText from "./CodeOfConductText";
import DataConsentText from "./DataConsentText";

/**
 * Country dropdown options — mirrors the list used on the onboarding
 * wizard so a fellow's country stays consistent across both forms.
 * "Other" is the escape hatch for countries we don't surface yet.
 */
const COUNTRIES = [
  "Nigeria",
  "Kenya",
  "South Africa",
  "Ghana",
  "Ethiopia",
  "Egypt",
  "Morocco",
  "Tanzania",
  "Uganda",
  "Rwanda",
  "Senegal",
  "Côte d'Ivoire",
  "Cameroon",
  "Zambia",
  "Zimbabwe",
  "Other",
];

/**
 * Two-step consent wizard fellows complete before the (fellow) layout
 * loads the dashboard. Step 1 captures the Code of Conduct acceptance;
 * Step 2 captures the Data Protection Consent + three granular
 * opt-ins (recording / comms / alumni comms).
 *
 * The server is the source of truth — on successful submit, the
 * fellow's user row gets `codeOfConductAcceptedAt` / `dataConsentAcceptedAt`
 * stamped and the gate in `(fellow)/layout.tsx` no longer redirects.
 *
 * `initialStep` lets the parent skip Step 1 when the fellow has
 * already accepted the Code of Conduct but not the Data Protection
 * Consent (e.g. they signed CoC, closed the tab, came back).
 */
export default function ConsentWizard({
  initialStep,
  fellowName,
  fellowCountry,
}: {
  initialStep: 1 | 2;
  fellowName: string;
  fellowCountry: string | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(initialStep);

  // Prefill: if the fellow's saved profile country isn't one of our
  // dropdown options (e.g. they typed something free-form previously),
  // map to "Other" so the dropdown has a valid match.
  const initialCountry = fellowCountry && COUNTRIES.includes(fellowCountry)
    ? fellowCountry
    : fellowCountry
      ? "Other"
      : "";

  // Step 1 — Code of Conduct
  const [cocAgreed, setCocAgreed] = useState(false);
  const [cocSignature, setCocSignature] = useState(fellowName);
  const [cocCountry, setCocCountry] = useState(initialCountry);
  const [cocBusy, setCocBusy] = useState(false);

  // Step 2 — Data Protection
  const [dpAgreed, setDpAgreed] = useState(false);
  const [dpSignature, setDpSignature] = useState(fellowName);
  const [dpCountry, setDpCountry] = useState(initialCountry);
  const [recordingOptIn, setRecordingOptIn] = useState(true);
  const [commsOptIn, setCommsOptIn] = useState(true);
  const [alumniCommsOptIn, setAlumniCommsOptIn] = useState(true);
  const [dpBusy, setDpBusy] = useState(false);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    timeZone: "Africa/Lagos",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function submitCoC() {
    if (!cocAgreed) {
      toast.error("Please tick the agreement box to continue.");
      return;
    }
    if (cocSignature.trim().length < 2 || cocCountry.trim().length < 2) {
      toast.error("Enter your full name and country.");
      return;
    }
    setCocBusy(true);
    try {
      const res = await fetch("/api/users/me/consents/code-of-conduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureName: cocSignature.trim(),
          country: cocCountry.trim(),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Couldn't save (${res.status})`);
      }
      setStep(2);
      // Scroll to top so the fellow sees the start of the new form.
      if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    } catch (err) {
      toast.errorFromException("Couldn't save Code of Conduct", err);
    } finally {
      setCocBusy(false);
    }
  }

  async function submitDP() {
    if (!dpAgreed) {
      toast.error("Please tick the agreement box to continue.");
      return;
    }
    if (dpSignature.trim().length < 2 || dpCountry.trim().length < 2) {
      toast.error("Enter your full name and country.");
      return;
    }
    setDpBusy(true);
    try {
      const res = await fetch("/api/users/me/consents/data-protection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureName: dpSignature.trim(),
          country: dpCountry.trim(),
          recordingOptIn,
          commsOptIn,
          alumniCommsOptIn,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Couldn't save (${res.status})`);
      }
      // router.refresh() re-runs the server layout so the gate sees the
      // new acceptedAt timestamps and lets the fellow through to /home.
      toast.success("Thanks — both consents recorded.");
      router.replace("/home");
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't save Data Protection consent", err);
    } finally {
      setDpBusy(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:py-12">
      {/* Progress strip */}
      <div className="flex items-center gap-3 text-sm">
        <StepDot active={step === 1} done={step > 1} label="1" />
        <span className="font-semibold text-gray-700">Code of Conduct</span>
        <span className="flex-1 border-t border-dashed border-gray-300" />
        <StepDot active={step === 2} done={false} label="2" />
        <span className="font-semibold text-gray-700">Data Protection</span>
      </div>

      {step === 1 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
          <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/60 p-4 md:p-5">
            <CodeOfConductText />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              value={cocSignature}
              onChange={setCocSignature}
              placeholder="As it should appear on your certificate"
            />
            <CountrySelect
              label="Country"
              value={cocCountry}
              onChange={setCocCountry}
            />
            <Field label="Date" value={todayLabel} readOnly />
          </div>

          <label className="mt-5 flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={cocAgreed}
              onChange={(e) => setCocAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-fellowship-navy focus:ring-fellowship-navy"
            />
            <span>
              I have read, understood, and agree to comply with this Code of
              Conduct and Participation Agreement.
            </span>
          </label>

          <div className="mt-6 flex justify-end">
            <Button
              variant="fellowship"
              onClick={submitCoC}
              disabled={cocBusy}
              className="bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
            >
              {cocBusy ? "Saving…" : "Agree & continue"}
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
          <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/60 p-4 md:p-5">
            <DataConsentText />
          </div>

          <div className="mt-6 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-800">
              Recordings and Media
            </p>
            <RadioRow
              label="I consent to session recordings that may include my participation."
              checked={recordingOptIn}
              onChange={() => setRecordingOptIn(true)}
              name="recording"
            />
            <RadioRow
              label="I do not consent to being recorded where avoidable."
              checked={!recordingOptIn}
              onChange={() => setRecordingOptIn(false)}
              name="recording"
            />
          </div>

          <div className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-800">Communications</p>
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={commsOptIn}
                onChange={(e) => setCommsOptIn(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-fellowship-navy focus:ring-fellowship-navy"
              />
              <span>
                I consent to receiving fellowship-related emails, updates, and
                opportunities.
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={alumniCommsOptIn}
                onChange={(e) => setAlumniCommsOptIn(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-fellowship-navy focus:ring-fellowship-navy"
              />
              <span>I consent to alumni communications after programme completion.</span>
            </label>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              value={dpSignature}
              onChange={setDpSignature}
            />
            <CountrySelect
              label="Country"
              value={dpCountry}
              onChange={setDpCountry}
            />
            <Field label="Date" value={todayLabel} readOnly />
          </div>

          <label className="mt-5 flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={dpAgreed}
              onChange={(e) => setDpAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-fellowship-navy focus:ring-fellowship-navy"
            />
            <span>
              I confirm I have read and understood this Data Protection Consent
              Form. I voluntarily consent to the collection, storage, and
              processing of my personal data for purposes related to the AI
              Ethics and Governance Fellowship.
            </span>
          </label>

          <div className="mt-6 flex flex-wrap justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              disabled={dpBusy}
            >
              Back
            </Button>
            <Button
              variant="fellowship"
              onClick={submitDP}
              disabled={dpBusy}
              className="bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
            >
              {dpBusy ? "Saving…" : "Agree & open dashboard"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function StepDot({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  const base =
    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold";
  if (done) return <span className={`${base} bg-success-500 text-white`}>✓</span>;
  if (active) return <span className={`${base} bg-fellowship-navy text-white`}>{label}</span>;
  return <span className={`${base} bg-gray-200 text-gray-500`}>{label}</span>;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 inline-block text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`h-10 w-full rounded-lg border border-gray-300 px-3 text-sm ${
          readOnly ? "bg-gray-50 text-gray-500" : "bg-white text-gray-800"
        }`}
      />
    </label>
  );
}

function CountrySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 inline-block text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800"
      >
        <option value="" disabled>
          Select your country
        </option>
        {COUNTRIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}

function RadioRow({
  label,
  checked,
  onChange,
  name,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  name: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm text-gray-700">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 border-gray-300 text-fellowship-navy focus:ring-fellowship-navy"
      />
      <span>{label}</span>
    </label>
  );
}
