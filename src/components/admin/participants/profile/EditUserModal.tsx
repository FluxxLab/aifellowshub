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
import type { Sector, UserProfile } from "@/lib/api/participants";

const SECTOR_TO_BACKEND: Record<Sector, string> = {
  Healthcare: "healthcare",
  Education: "edtech",
  Agriculture: "agriculture",
  "Economic Inclusion Development": "economic_inclusion_development",
};

const SECTOR_LABEL_BY_BACKEND: Record<string, Sector> = {
  healthcare: "Healthcare",
  edtech: "Education",
  agriculture: "Agriculture",
  economic_inclusion_development: "Economic Inclusion Development",
};

const ALL_SECTORS: Sector[] = [
  "Healthcare",
  "Education",
  "Agriculture",
  "Economic Inclusion Development",
];

type EditUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
};

/**
 * Admin edit of a non-fellow user's profile (mentor / faculty /
 * admin / super_admin). Mirrors EditFellowModal minus the fellow-
 * specific status enum. Sends a diff to PATCH /admin/users/:id so
 * audit logs only record the fields the admin actually touched.
 */
export default function EditUserModal({
  isOpen,
  onClose,
  user,
}: EditUserModalProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState(user.fullName);
  const [jobTitle, setJobTitle] = useState(user.jobTitle ?? "");
  const [organisation, setOrganisation] = useState(user.organisation ?? "");
  const [country, setCountry] = useState(user.country ?? "");
  const [sector, setSector] = useState<Sector | null>(
    user.sector ? SECTOR_LABEL_BY_BACKEND[user.sector] ?? null : null,
  );
  const [bio, setBio] = useState(user.bio ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedinUrl ?? "");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = fullName.trim().length > 1 && !submitting;
  const roleLabel =
    user.role === "mentor"
      ? "mentor"
      : user.role === "faculty"
        ? "faculty member"
        : user.role === "admin" || user.role === "super_admin"
          ? "admin"
          : "user";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    const body: Record<string, unknown> = {};
    if (fullName.trim() !== user.fullName) body.fullName = fullName.trim();
    if (jobTitle.trim() !== (user.jobTitle ?? ""))
      body.jobTitle = jobTitle.trim() || null;
    if (organisation.trim() !== (user.organisation ?? ""))
      body.organisation = organisation.trim() || null;
    if (country.trim() !== (user.country ?? ""))
      body.country = country.trim() || null;
    const sectorBackend = sector ? SECTOR_TO_BACKEND[sector] : null;
    if (sectorBackend !== (user.sector ?? null)) body.sector = sectorBackend;
    if (bio.trim() !== (user.bio ?? "")) body.bio = bio.trim() || null;
    if (linkedinUrl.trim() !== (user.linkedinUrl ?? ""))
      body.linkedinUrl = linkedinUrl.trim() || null;

    if (Object.keys(body).length === 0) {
      toast.success("No changes to save");
      setSubmitting(false);
      onClose();
      return;
    }

    try {
      await apiFetch(`/admin/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        body,
      });
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
            Edit {roleLabel}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Update {user.fullName}&apos;s profile. Email is fixed; use
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
              <button
                type="button"
                onClick={() => setSector(null)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  sector === null
                    ? "bg-fellowship-navy text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                )}
              >
                None
              </button>
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
            <p className="mt-2 text-xs text-gray-500">
              {user.role === "mentor"
                ? "Sector controls which fellows this mentor is auto-resolved for via the sector-match fallback."
                : "Optional. Helps participants find this person."}
            </p>
          </div>

          <div>
            <Label>Bio</Label>
            <TextArea
              rows={3}
              placeholder="Short bio shown on the profile."
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
