"use client";
import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { CheckCircleIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import {
  updateCohortSettings,
  updateDefaultsSettings,
  updateNotificationSettings,
  updateRegistrationSettings,
  type Settings,
} from "@/lib/api/settings";

type SettingsViewProps = {
 initial: Settings;
};

export default function SettingsView({ initial }: SettingsViewProps) {
 return (
 <div className="flex flex-col gap-4 md:gap-6">
 <Header />
 <CohortSection initial={initial.cohort} />
 <RegistrationSection initial={initial.registration} />
 <NotificationsSection initial={initial.notifications} />
 <DefaultsSection initial={initial.defaults} />
 </div>
 );
}

function Header() {
 return (
 <div>
 <h1 className="text-title-md font-bold text-gray-800">
 Programme settings
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 Cohort details, registration controls, notifications, and programme
 defaults.
 </p>
 </div>
 );
}

/* ---------- Cohort ---------- */

function CohortSection({ initial }: { initial: Settings["cohort"] }) {
 const [name, setName] = useState(initial.name);
 const [description, setDescription] = useState(initial.description);
 const [startDate, setStartDate] = useState(initial.startDate);
 const [endDate, setEndDate] = useState(initial.endDate);

 return (
 <SectionCard
 title="Cohort" description="The active cohort fellows are enrolled in. End date controls when certificates are eligible to be issued." onSave={async () => {
 await updateCohortSettings({
   name,
   description,
   startDate: startDate || undefined,
   endDate: endDate || undefined,
 });
 }}
 >
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <FieldGroup>
 <Label>Cohort name</Label>
 <Input
 type="text" defaultValue={name}
 onChange={(e) => setName(e.target.value)}
 />
 </FieldGroup>
 <FieldGroup>
 <Label>Identifier</Label>
 <Input type="text" defaultValue={initial.id} disabled />
 </FieldGroup>
 </div>
 <FieldGroup>
 <Label>Description</Label>
 <TextArea rows={2} value={description} onChange={setDescription} />
 </FieldGroup>
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
 <FieldGroup>
 <Label>Start date</Label>
 <Input
 type="date" defaultValue={startDate}
 onChange={(e) => setStartDate(e.target.value)}
 />
 </FieldGroup>
 <FieldGroup>
 <Label>End date</Label>
 <Input
 type="date" defaultValue={endDate}
 onChange={(e) => setEndDate(e.target.value)}
 />
 </FieldGroup>
 <FieldGroup>
 <Label>Weeks</Label>
 <Input type="number" defaultValue={String(initial.weekCount)} disabled />
 </FieldGroup>
 </div>
 </SectionCard>
 );
}

/* ---------- Registration ---------- */

function RegistrationSection({
 initial,
}: {
 initial: Settings["registration"];
}) {
 const [capacity, setCapacity] = useState(initial.capacity);
 const [isOpen, setIsOpen] = useState(initial.isOpen);
 const [waitlistEnabled, setWaitlistEnabled] = useState(initial.waitlistEnabled);
 const [closeDate, setCloseDate] = useState(initial.registrationCloseDate ??"");

 const seatsLeft = Math.max(0, capacity - initial.enrolledCount);
 const fillPct = Math.round((initial.enrolledCount / capacity) * 100);

 return (
 <SectionCard
 title="Registration" description="Capacity-gated, first-come-first-served. Onboarding completion gives login access." onSave={async () => {
 await updateRegistrationSettings({
   isOpen,
   capacity,
   waitlistEnabled,
   registrationCloseDate: closeDate ? closeDate : null,
 });
 }}
 >
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <FieldGroup>
 <Label>Capacity</Label>
 <Input
 type="number" min="1" defaultValue={String(capacity)}
 onChange={(e) => setCapacity(Number(e.target.value))}
 />
 <Hint>
 {initial.enrolledCount} enrolled · {seatsLeft} seats left ({fillPct}%
 full)
 </Hint>
 </FieldGroup>
 <FieldGroup>
 <Label>Registration close date</Label>
 <Input
 type="date" defaultValue={closeDate}
 onChange={(e) => setCloseDate(e.target.value)}
 />
 <Hint>Leave empty to close automatically when capacity is reached.</Hint>
 </FieldGroup>
 </div>
 <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
 <Switch
 label="Registration is open" defaultChecked={isOpen}
 onChange={setIsOpen}
 />
 <Switch
 label="Allow waitlist when capacity is reached" defaultChecked={waitlistEnabled}
 onChange={setWaitlistEnabled}
 />
 </div>
 </SectionCard>
 );
}

/* ---------- Notifications ---------- */

function NotificationsSection({
 initial,
}: {
 initial: Settings["notifications"];
}) {
 const [email, setEmail] = useState(initial.defaultEmail);
 const [push, setPush] = useState(initial.defaultPush);
 const [inApp, setInApp] = useState(initial.defaultInApp);
 const [reminders, setReminders] = useState(initial.sessionReminders);

 const toggleReminder = (i: number) => {
 setReminders((prev) =>
 prev.map((r, idx) => (idx === i ? { ...r, enabled: !r.enabled } : r))
 );
 };

 return (
 <SectionCard
 title="Notifications" description="Defaults applied to new fellows. Each fellow can override their own preferences in their profile." onSave={async () => {
 await updateNotificationSettings({
   defaultEmail: email,
   defaultPush: push,
   defaultInApp: inApp,
   sessionReminders: reminders,
 });
 }}
 >
 <div>
 <Label>Default channels for new fellows</Label>
 <div className="mt-2 flex flex-col gap-3">
 <Switch
 label="In-app notifications" defaultChecked={inApp}
 onChange={setInApp}
 />
 <Switch
 label="Email notifications (via Resend)" defaultChecked={email}
 onChange={setEmail}
 />
 <Switch
 label="Push notifications (mobile, via Expo)" defaultChecked={push}
 onChange={setPush}
 />
 </div>
 </div>

 <div className="border-t border-gray-100 pt-4">
 <Label>Live-session reminders</Label>
 <p className="mb-2 text-xs text-gray-500">
 When to fire a reminder before a scheduled session begins.
 </p>
 <div className="flex flex-col gap-2">
 {reminders.map((r, i) => (
 <div
 key={i}
 className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2.5">
 <span className="text-sm font-medium text-gray-700">
 {formatReminderLabel(r.hoursBefore)}
 </span>
 <Switch
 label="" defaultChecked={r.enabled}
 onChange={() => toggleReminder(i)}
 />
 </div>
 ))}
 </div>
 </div>
 </SectionCard>
 );
}

function formatReminderLabel(hours: number): string {
 if (hours < 1) {
 const minutes = Math.round(hours * 60);
 return `T-${minutes} minutes before`;
 }
 if (hours === 1) return "T-1 hour before";
 if (hours === 24) return "T-24 hours (1 day) before";
 return `T-${hours} hours before`;
}

/* ---------- Programme defaults ---------- */

function DefaultsSection({ initial }: { initial: Settings["defaults"] }) {
 const [passMark, setPassMark] = useState(initial.assessmentPassMark);
 const [threshold, setThreshold] = useState(initial.attendanceThresholdPercent);

 return (
 <SectionCard
 title="Programme defaults" description="Defaults applied when creating new assessments and sessions. Each item can be overridden individually." onSave={async () => {
 await updateDefaultsSettings({
   assessmentPassMark: passMark,
   attendanceThresholdPercent: threshold,
 });
 }}
 >
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <FieldGroup>
 <Label>Default assessment pass mark (%)</Label>
 <Input
 type="number" min="0" max="100" defaultValue={String(passMark)}
 onChange={(e) => setPassMark(Number(e.target.value))}
 />
 <Hint>
 New assessments start with this pass mark. Faculty can override per
 assessment.
 </Hint>
 </FieldGroup>
 <FieldGroup>
 <Label>Default attendance threshold (%)</Label>
 <Input
 type="number" min="0" max="100" defaultValue={String(threshold)}
 onChange={(e) => setThreshold(Number(e.target.value))}
 />
 <Hint>
 BRD §6.4 default is 50% of session duration. Admin can override per
 session.
 </Hint>
 </FieldGroup>
 </div>
 </SectionCard>
 );
}

/* ---------- Section primitives ---------- */

function SectionCard({
 title,
 description,
 onSave,
 children,
}: {
 title: string;
 description: string;
 onSave: () => Promise<void>;
 children: React.ReactNode;
}) {
 const [saving, setSaving] = useState(false);
 const [savedAt, setSavedAt] = useState<number | null>(null);

 const handleSave = async () => {
 setSaving(true);
 try {
   await onSave();
   setSavedAt(Date.now());
   setTimeout(() => setSavedAt(null), 1800);
   toast.success(`${title} saved`);
 } catch (err) {
   toast.errorFromException(`Couldn't save ${title.toLowerCase()}`, err);
 } finally {
   setSaving(false);
 }
 };

 return (
 <SectionShell>
 <section className="rounded-2xl border border-gray-200 bg-white">
 <header className="flex flex-col gap-1 px-5 py-5 sm:px-6">
 <h2 className="text-base font-semibold text-gray-800">
 {title}
 </h2>
 <p className="text-sm text-gray-500">{description}</p>
 </header>
 <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-5 sm:px-6">
 {children}
 </div>
 <footer className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4 sm:px-6">
 {savedAt !== null && (
 <span
 className={cn("inline-flex items-center gap-1 text-sm font-medium text-success-600","animate-in fade-in ")}
 >
 <CheckCircleIcon className="h-4 w-4"/>
 Saved
 </span>
 )}
 <Button
 variant="fellowship" size="sm" onClick={handleSave}
 disabled={saving}
 >
 {saving ?"Saving…":"Save"}
 </Button>
 </footer>
 </section>
 </SectionShell>
 );
}

/**
 * Subtle fade-up wrapper for each settings section. Sections appear once
 * when scrolled near the viewport — keeps the page feeling lively without
 * the all-at-once entrance that reads as gimmicky.
 */
function SectionShell({ children }: { children: React.ReactNode }) {
 const reduce = useReducedMotion();
 if (reduce) return <>{children}</>;
 return (
 <motion.div
 initial={{ opacity: 0, y: 10 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, margin: "-50px" }}
 transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
 >
 {children}
 </motion.div>
 );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
 return <div className="flex flex-col gap-1.5">{children}</div>;
}

function Hint({ children }: { children: React.ReactNode }) {
 return (
 <p className="text-xs text-gray-500">{children}</p>
 );
}
