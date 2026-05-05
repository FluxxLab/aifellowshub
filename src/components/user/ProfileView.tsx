"use client";
import React, { useState } from "react";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/SelectField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { CheckCircleIcon, EnvelopeIcon, LockIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { updateMyProfile, type MyProfile, type NotificationEventToggles } from "@/lib/api/profile";
import type { Sector } from "@/lib/api/participants";
import type { Role } from "@/lib/auth/useCurrentUser";

const SECTORS: Sector[] = ["Health AI","EdTech","Agriculture","Fintech","Governance","Other",
];

const ROLE_LABEL: Record<Role, string> = {
 super_admin:"Super admin",
 admin:"Admin",
 faculty:"Faculty",
 mentor:"Mentor",
 fellow:"Fellow",
};

type ProfileViewProps = {
 initial: MyProfile;
};

export default function ProfileView({ initial }: ProfileViewProps) {
 const homeHref = initial.role === "fellow" ? "/home" : initial.role === "mentor" ? "/mentor" : initial.role === "faculty" ? "/faculty" : "/dashboard";
 const homeLabel = initial.role === "fellow" ? "Home" : initial.role === "mentor" ? "Mentor home" : initial.role === "faculty" ? "Faculty home" : "Dashboard";
 return (
 <div className="flex flex-col gap-4 md:gap-6">
 <Breadcrumbs items={[{ label: homeLabel, href: homeHref }, { label: "Profile" }]} />
 <ProfileHeader profile={initial} />
 <ProfileSection initial={initial} />
 <AccountSection initial={initial} />
 <NotificationsSection initial={initial.notifications} />
 </div>
 );
}

/* ---------- Header ---------- */

function ProfileHeader({ profile }: { profile: MyProfile }) {
 const joined = new Date(profile.joinedAt).toLocaleDateString(undefined, {
 month:"long",
 year:"numeric",
 });
 return (
 <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6">
 <AvatarText name={profile.fullName} className="h-20 w-20 text-xl"/>
 <div className="min-w-0 flex-1">
 <h1 className="text-title-sm font-bold text-gray-800 sm:text-title-md">
 {profile.fullName}
 </h1>
 <p className="mt-1 text-sm text-gray-500">
 {profile.jobTitle} · {profile.organisation} · {profile.country}
 </p>
 <div className="mt-3 flex flex-wrap items-center gap-2">
 <Badge color="info">{ROLE_LABEL[profile.role]}</Badge>
 <Badge color="light">{profile.sector}</Badge>
 <span className="text-xs text-gray-400">
 Member since {joined}
 </span>
 </div>
 </div>
 </header>
 );
}

/* ---------- Profile section ---------- */

function ProfileSection({ initial }: { initial: MyProfile }) {
 const [fullName, setFullName] = useState(initial.fullName);
 const [country, setCountry] = useState(initial.country);
 const [organisation, setOrganisation] = useState(initial.organisation);
 const [jobTitle, setJobTitle] = useState(initial.jobTitle);
 const [sector, setSector] = useState<Sector>(initial.sector);
 const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedinUrl);
 const [bio, setBio] = useState(initial.bio);

 return (
 <SectionCard
 title="Profile" description="What other fellows, mentors, and admins see when they look you up." onSave={async () => {
 // Persists to backend via the BFF; if the backend is offline this throws
 // and SectionCard surfaces the error.
 await updateMyProfile({
   fullName,
   country: country || null,
   organisation: organisation || null,
   jobTitle: jobTitle || null,
   sector,
   bio: bio || null,
   linkedinUrl: linkedinUrl || null,
 });
 }}
 >
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <FieldGroup>
 <Label>
 Full name <span className="text-error-500">*</span>
 </Label>
 <Input
 type="text" defaultValue={fullName}
 onChange={(e) => setFullName(e.target.value)}
 />
 </FieldGroup>
 <FieldGroup>
 <Label>Country</Label>
 <Input
 type="text" defaultValue={country}
 onChange={(e) => setCountry(e.target.value)}
 />
 </FieldGroup>
 </div>
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <FieldGroup>
 <Label>Organisation</Label>
 <Input
 type="text" defaultValue={organisation}
 onChange={(e) => setOrganisation(e.target.value)}
 />
 </FieldGroup>
 <FieldGroup>
 <Label>Job title</Label>
 <Input
 type="text" defaultValue={jobTitle}
 onChange={(e) => setJobTitle(e.target.value)}
 />
 </FieldGroup>
 </div>
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <FieldGroup>
 <Label>Sector</Label>
 <SelectField<Sector>
 value={sector}
 onChange={setSector}
 options={SECTORS.map((s) => ({ value: s, label: s }))}
 />
 </FieldGroup>
 <FieldGroup>
 <Label>LinkedIn</Label>
 <Input
 type="url" placeholder="https://linkedin.com/in/…" defaultValue={linkedinUrl}
 onChange={(e) => setLinkedinUrl(e.target.value)}
 />
 </FieldGroup>
 </div>
 <FieldGroup>
 <Label>Bio</Label>
 <TextArea rows={4} value={bio} onChange={setBio} />
 <Hint>A short paragraph fellows and mentors will see on your profile.</Hint>
 </FieldGroup>
 </SectionCard>
 );
}

/* ---------- Account section (locked) ---------- */

function AccountSection({ initial }: { initial: MyProfile }) {
 return (
 <section className="rounded-2xl border border-gray-200 bg-white">
 <header className="flex flex-col gap-1 px-5 py-5 sm:px-6">
 <h2 className="text-base font-semibold text-gray-800">
 Account
 </h2>
 <p className="text-sm text-gray-500">
 Sensitive details. Email and role can&apos;t be changed here — contact
 an admin.
 </p>
 </header>
 <div className="flex flex-col gap-4 border-t border-gray-100 px-5 py-5 sm:px-6">
 <div className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-center gap-3">
 <EnvelopeIcon className="h-5 w-5 text-gray-500"/>
 <div>
 <span className="block text-sm font-medium text-gray-800">
 {initial.email}
 </span>
 <span className="block text-xs text-gray-500">
 Email · locked
 </span>
 </div>
 </div>
 <Badge color="light">Verified</Badge>
 </div>

 <div className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-center gap-3">
 <LockIcon className="h-5 w-5 text-gray-500"/>
 <div>
 <span className="block text-sm font-medium text-gray-800">
 Password
 </span>
 <span className="block text-xs text-gray-500">
 Last changed when you set up your account
 </span>
 </div>
 </div>
 <Button variant="outline" size="sm">
 Change password
 </Button>
 </div>

 <div className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
 <div>
 <span className="block text-sm font-medium text-gray-800">
 Role
 </span>
 <span className="block text-xs text-gray-500">
 Granted by an admin
 </span>
 </div>
 <Badge color="info">{ROLE_LABEL[initial.role]}</Badge>
 </div>
 </div>
 </section>
 );
}

/* ---------- Notifications section ---------- */

const EVENT_LABELS: Record<keyof NotificationEventToggles, string> = {
 sessionReminders:"Live-session reminders",
 assignmentsDue:"Assignments due",
 modulesUnlocked:"Modules unlocked",
 certificateIssued:"Certificate issued",
 forumReplies:"Forum replies & mentions",
 capstoneReviews:"Capstone review updates",
};

function NotificationsSection({
 initial,
}: {
 initial: MyProfile["notifications"];
}) {
 const [email, setEmail] = useState(initial.emailEnabled);
 const [push, setPush] = useState(initial.pushEnabled);
 const [inApp, setInApp] = useState(initial.inAppEnabled);
 const [events, setEvents] = useState(initial.events);

 const toggleEvent = (key: keyof NotificationEventToggles) => {
 setEvents((prev) => ({ ...prev, [key]: !prev[key] }));
 };

 return (
 <SectionCard
 title="Notifications" description="What you want to be notified about, and where. Overrides the programme defaults." onSave={() => {
 // Phase 2: PATCH /users/me/notifications
 }}
 >
 <div>
 <Label>Channels</Label>
 <div className="mt-2 flex flex-col gap-3">
 <Switch
 label="In-app notifications" defaultChecked={inApp}
 onChange={setInApp}
 />
 <Switch
 label="Email notifications" defaultChecked={email}
 onChange={setEmail}
 />
 <Switch
 label="Push notifications (mobile)" defaultChecked={push}
 onChange={setPush}
 />
 </div>
 </div>

 <div className="border-t border-gray-100 pt-4">
 <Label>Event types</Label>
 <p className="mb-3 text-xs text-gray-500">
 Pick which events trigger a notification. Channel routing is set above.
 </p>
 <div className="flex flex-col gap-2">
 {(Object.keys(EVENT_LABELS) as (keyof NotificationEventToggles)[]).map(
 (key) => (
 <div
 key={key}
 className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2.5">
 <span className="text-sm font-medium text-gray-700">
 {EVENT_LABELS[key]}
 </span>
 <Switch
 label="" defaultChecked={events[key]}
 onChange={() => toggleEvent(key)}
 />
 </div>
 )
 )}
 </div>
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
 onSave: () => void | Promise<void>;
 children: React.ReactNode;
}) {
 const [saving, setSaving] = useState(false);
 const [savedAt, setSavedAt] = useState<number | null>(null);
 const [error, setError] = useState<string | null>(null);

 const handleSave = async () => {
 setSaving(true);
 setError(null);
 try {
 await onSave();
 setSavedAt(Date.now());
 window.setTimeout(() => setSavedAt(null), 1800);
 } catch (err) {
 setError(err instanceof Error ? err.message : "Save failed.");
 }
 setSaving(false);
 };

 return (
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
 {error && (
 <span className="inline-flex items-center gap-1 text-sm font-medium text-error-600">
 {error}
 </span>
 )}
 {!error && savedAt !== null && (
 <span
 className={cn("inline-flex items-center gap-1 text-sm font-medium text-success-600")}
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
