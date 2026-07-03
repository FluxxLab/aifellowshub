"use client";
import { useState } from "react";
import Link from "next/link";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, PencilIcon } from "@/icons";
import EditUserModal from "./EditUserModal";
import { sectorLabel } from "@/lib/sector";
import type { UserProfile } from "@/lib/api/participants";

const ROLE_LABEL: Record<string, string> = {
  fellow: "Fellow",
  mentor: "Mentor",
  faculty: "Faculty",
  admin: "Admin",
  super_admin: "Super admin",
};

/**
 * Profile view for non-fellow roles. Lighter than the fellow detail
 * page — fellows have curriculum/attendance/capstone tied to them, but
 * mentors / faculty / admins just need contact + role-specific stats.
 */
export default function GenericProfileView({
  user,
}: {
  user: UserProfile;
}) {
  const [editOpen, setEditOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <EditUserModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        user={user}
      />
      <Link
        href="/participants"
        className="inline-flex w-fit items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Back to participants
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <AvatarText name={user.fullName} className="h-16 w-16 text-base" />
            <div className="flex-1">
              <h1 className="text-title-sm font-bold text-gray-800">
                {user.fullName}
              </h1>
              {user.jobTitle || user.organisation || user.country ? (
                <p className="mt-1 text-sm text-gray-500">
                  {[user.jobTitle, user.organisation, user.country]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge color="info">
                  {ROLE_LABEL[user.role] ?? user.role}
                </Badge>
                {user.isActive ? (
                  <Badge color="success">Active</Badge>
                ) : (
                  <Badge color="light">Inactive</Badge>
                )}
                {user.sector && (
                  <Badge color="light">
                    {sectorLabel(user.sector)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="shrink-0">
            <Button
              variant="outline"
              size="sm"
              startIcon={<PencilIcon />}
              onClick={() => setEditOpen(true)}
            >
              Edit
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-7">
          <Card title="Contact">
            <dl className="flex flex-col gap-3">
              <Row label="Email" value={user.email} />
              {user.country && <Row label="Country" value={user.country} />}
              {user.organisation && (
                <Row label="Organisation" value={user.organisation} />
              )}
              {user.jobTitle && <Row label="Job title" value={user.jobTitle} />}
              {user.linkedinUrl && (
                <Row
                  label="LinkedIn"
                  value={
                    <a
                      href={user.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-fellowship-navy hover:text-fellowship-navy-dark"
                    >
                      {user.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  }
                />
              )}
              <Row
                label="Joined"
                value={new Date(user.joinedAt).toLocaleDateString(undefined, { timeZone: "Africa/Lagos" })}
              />
            </dl>
          </Card>

          {user.bio && (
            <div className="mt-4 md:mt-6">
              <Card title="Bio">
                <p className="text-sm leading-relaxed text-gray-700">
                  {user.bio}
                </p>
              </Card>
            </div>
          )}
        </div>

        <div className="col-span-12 xl:col-span-5">
          <RoleStatsCard user={user} />
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wider text-gray-400">
        {label}
      </dt>
      <dd className="text-sm text-gray-700">{value}</dd>
    </div>
  );
}

function RoleStatsCard({ user }: { user: UserProfile }) {
  const stats = user.stats;
  if (!stats) return null;

  if (stats.kind === "mentor") {
    return (
      <Card title="Mentor activity">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Stat label="Assigned fellows" value={stats.assignedFellowsCount} />
          <Stat label="Pending reviews" value={stats.pendingReviewsCount} />
          <Stat label="Booking requests" value={stats.bookingsCount} />
        </ul>
      </Card>
    );
  }

  if (stats.kind === "faculty") {
    return (
      <Card title="Faculty activity">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Stat label="Owned modules" value={stats.ownedModulesCount} />
          <Stat label="In draft" value={stats.draftModulesCount} />
        </ul>
      </Card>
    );
  }

  if (stats.kind === "admin") {
    return (
      <Card title="Admin activity">
        <ul className="grid grid-cols-1 gap-3">
          <Stat
            label="Last active"
            value={
              stats.lastActiveAt
                ? new Date(stats.lastActiveAt).toLocaleString(undefined, { timeZone: "Africa/Lagos" })
                : "Never signed in"
            }
          />
        </ul>
      </Card>
    );
  }

  return null;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <li className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-gray-800">{value}</p>
    </li>
  );
}
