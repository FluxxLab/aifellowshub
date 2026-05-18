"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import type { FellowProfile, FellowStatus, Sector } from "@/lib/api/participants";

const SECTOR_TO_BACKEND: Record<Sector, string> = {
  Healthcare: "healthcare",
  Education: "edtech",
  Agriculture: "agriculture",
  "Economic Inclusion Development": "economic_inclusion_development",
};

const STATUS_TO_BACKEND: Record<FellowStatus, string> = {
  active: "active",
  "at-risk": "at_risk",
  inactive: "inactive",
};

const ALL_SECTORS: Sector[] = [
  "Healthcare",
  "Education",
  "Agriculture",
  "Economic Inclusion Development",
];

const ALL_STATUSES: { id: FellowStatus; label: string; description: string }[] =
  [
    { id: "active", label: "Active", description: "Engaged with the programme." },
    {
      id: "at-risk",
      label: "At-risk",
      description: "Falling behind — needs intervention.",
    },
    {
      id: "inactive",
      label: "Inactive",
      description: "Disengaged but not deactivated.",
    },
  ];

type EditFellowModalProps = {
  isOpen: boolean;
  onClose: () => void;
  fellow: FellowProfile;
};

/**
 * Admin edit of a fellow's profile fields. Pre-populates from the
 * current profile and submits only the changes via PATCH
 * /admin/fellows/:id. `email` and `isActive` are intentionally
 * out-of-scope here — email is the login key, isActive is owned by
 * the deactivate/reactivate flow.
 */
export default function EditFellowModal({
  isOpen,
  onClose,
  fellow,
}: EditFellowModalProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(fellow.fullName);
  const [jobTitle, setJobTitle] = useState(fellow.jobTitle ?? "");
  const [organisation, setOrganisation] = useState(fellow.organisation ?? "");
  const [country, setCountry] = useState(fellow.country ?? "");
  const [sector, setSector] = useState<Sector>(fellow.sector);
  const [status, setStatus] = useState<FellowStatus>(fellow.status);
  const [bio, setBio] = useState(fellow.bio ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(fellow.linkedinUrl ?? "");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = fullName.trim().length > 1 && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    // Build a diff so we don't accidentally clobber a field the admin
    // didn't touch (and so backend audit log records what actually changed).
    const body: Record<string, unknown> = {};
    if (fullName.trim() !== fellow.fullName) body.fullName = fullName.trim();
    if (jobTitle.trim() !== (fellow.jobTitle ?? ""))
      body.jobTitle = jobTitle.trim() || null;
    if (organisation.trim() !== (fellow.organisation ?? ""))
      body.organisation = organisation.trim() || null;
    if (country.trim() !== (fellow.country ?? ""))
      body.country = country.trim() || null;
    if (sector !== fellow.sector) body.sector = SECTOR_TO_BACKEND[sector];
    if (status !== fellow.status) body.status = STATUS_TO_BACKEND[status];
    if (bio.trim() !== (fellow.bio ?? "")) body.bio = bio.trim() || null;
    if (linkedinUrl.trim() !== (fellow.linkedinUrl ?? ""))
      body.linkedinUrl = linkedinUrl.trim() || null;

    if (Object.keys(body).length === 0) {
      toast.success("No changes to save");
      setSubmitting(false);
      onClose();
      return;
    }

    try {
      await apiFetch(
        `/admin/fellows/${encodeURIComponent(fellow.id)}`,
        { method: "PATCH", body },
      );
      toast.success("Profile updated");
      router.refresh();
      onClose();
    } catch (err) {
      toast.errorFromException("Couldn't save changes", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-xl">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-title-sm font-bold text-gray-800">
            Edit fellow
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Update {fellow.fullName}&apos;s profile. Email is fixed; use
            Deactivate to remove access.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <Label>
              Full name <span className="text-error-500">*</span>
            </Label>
            <Input
              type="text"
              defaultValue={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Job title</Label>
              <Input
                type="text"
                defaultValue={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Organisation</Label>
              <Input
                type="text"
                defaultValue={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Country</Label>
              <Input
                type="text"
                defaultValue={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div>
              <Label>LinkedIn</Label>
              <Input
                type="url"
                placeholder="https://linkedin.com/in/…"
                defaultValue={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Sector</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_SECTORS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSector(s)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    sector === s
                      ? "bg-fellowship-navy text-white"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id)}
                  aria-pressed={status === s.id}
                  className={cn(
                    "flex flex-col rounded-lg border p-3 text-left transition-colors",
                    status === s.id
                      ? "border-fellowship-navy bg-fellowship-navy/5"
                      : "border-gray-200 hover:border-gray-300",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      status === s.id
                        ? "text-fellowship-navy"
                        : "text-gray-800",
                    )}
                  >
                    {s.label}
                  </span>
                  <span className="mt-0.5 text-xs text-gray-500">
                    {s.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Bio</Label>
            <TextArea
              rows={3}
              placeholder="Short bio shown on the fellow's profile."
              value={bio}
              onChange={setBio}
            />
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="fellowship"
            size="sm"
            type="submit"
            disabled={!canSubmit}
            className="bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
          >
            {submitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
