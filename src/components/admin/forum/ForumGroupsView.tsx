"use client";
import React, { useMemo, useState } from "react";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { ChevronRightIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { toast } from "@/lib/toast";
import {
  addForumGroupMember,
  createForumGroup,
  deleteForumGroup,
  listForumGroups,
  removeForumGroupMember,
  updateForumGroup,
  type ForumGroup,
} from "@/lib/api/fellow-forum";

type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: "fellow" | "mentor" | "faculty" | "admin";
};

/**
 * Admin Forum Groups page.
 *
 * Left rail: list of groups (sortable by member count). Right pane:
 * details of the selected group — name, description, privacy toggle,
 * members list with add/remove. Member picker searches across all
 * users in the system.
 *
 * Visibility rules and "default group can't be deleted / made
 * private" are enforced server-side; the UI just disables the
 * controls so admins don't try.
 */
export default function ForumGroupsView({
  initialGroups,
  users,
}: {
  initialGroups: ForumGroup[];
  users: AdminUser[];
}) {
  const { confirm, dialog } = useConfirm();
  const [groups, setGroups] = useState(initialGroups);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialGroups[0]?.id ?? null,
  );
  const [creating, setCreating] = useState(false);

  const selected = groups.find((g) => g.id === selectedId) ?? null;

  // Members of the selected group — fetched lazily once per selection.
  // For now we approximate by intersecting `users` against an external
  // GET (skipped for v1 — the count we already have is enough to drive
  // the directory; a per-group member list endpoint can be added later
  // when the membership UI grows beyond add/remove).
  const refresh = async () => {
    try {
      const fresh = await listForumGroups();
      setGroups(fresh);
    } catch (err) {
      toast.errorFromException("Couldn't refresh groups", err);
    }
  };

  const onCreate = async (payload: {
    name: string;
    slug?: string;
    description?: string;
    isPrivate?: boolean;
  }) => {
    try {
      const created = await createForumGroup(payload);
      // The create endpoint returns the bare row without the
      // viewer-scoped flags the directory needs; refetch to keep the
      // shape consistent.
      await refresh();
      setSelectedId(created.id);
      setCreating(false);
      toast.success("Group created");
    } catch (err) {
      toast.errorFromException("Couldn't create group", err);
    }
  };

  const onSavePatch = async (
    id: string,
    patch: { name?: string; description?: string; isPrivate?: boolean },
  ) => {
    try {
      await updateForumGroup(id, patch);
      await refresh();
      toast.success("Group updated");
    } catch (err) {
      toast.errorFromException("Couldn't update group", err);
    }
  };

  const onDelete = async (g: ForumGroup) => {
    if (g.isDefault) {
      toast.error(
        "Can't delete General",
        "The default group is shared by everyone.",
      );
      return;
    }
    const ok = await confirm({
      title: `Delete "${g.name}"?`,
      message:
        "All threads in this channel will be removed. This can't be undone.",
      confirmLabel: "Delete group",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deleteForumGroup(g.id);
      const next = groups.filter((x) => x.id !== g.id);
      setGroups(next);
      setSelectedId(next[0]?.id ?? null);
      toast.success("Group deleted");
    } catch (err) {
      toast.errorFromException("Couldn't delete group", err);
    }
  };

  const onAddMember = async (groupId: string, userId: string) => {
    try {
      await addForumGroupMember(groupId, userId);
      await refresh();
      toast.success("Member added");
    } catch (err) {
      toast.errorFromException("Couldn't add member", err);
    }
  };

  const onRemoveMember = async (groupId: string, userId: string) => {
    try {
      await removeForumGroupMember(groupId, userId);
      await refresh();
      toast.success("Member removed");
    } catch (err) {
      toast.errorFromException("Couldn't remove member", err);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {dialog}
      <Breadcrumbs
        items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Forum groups" }]}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl">
            Forum groups
          </h1>
          <p className="mt-2 max-w-2xl text-gray-600">
            Channels are how the cohort is split into discussion
            spaces. Everyone is in <strong>General</strong>; admins
            add fellows to other channels as they progress.
          </p>
        </div>
        <Button size="md" variant="fellowship" onClick={() => setCreating(true)}>
          <PlusIcon className="h-4 w-4" />
          New group
        </Button>
      </div>

      {creating && (
        <CreateGroupCard onCancel={() => setCreating(false)} onCreate={onCreate} />
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[300px_minmax(0,1fr)] md:gap-6">
        {/* Group list rail */}
        <aside className="rounded-2xl border border-gray-200 bg-white p-3">
          <ul className="flex flex-col gap-1">
            {groups.map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(g.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                    selectedId === g.id
                      ? "bg-fellowship-navy text-white"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{g.name}</p>
                    <p
                      className={`truncate text-xs ${selectedId === g.id ? "text-white/70" : "text-gray-500"}`}
                    >
                      {g.memberCount} member{g.memberCount === 1 ? "" : "s"} ·{" "}
                      {g.threadCount} thread{g.threadCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  {g.isDefault && (
                    <Badge color="info" variant="light">
                      default
                    </Badge>
                  )}
                  {g.isPrivate && (
                    <Badge color="light" variant="light">
                      private
                    </Badge>
                  )}
                  <ChevronRightIcon
                    className={`h-4 w-4 shrink-0 ${selectedId === g.id ? "text-white" : "text-gray-400"}`}
                  />
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Detail pane */}
        {selected ? (
          <GroupDetailPane
            group={selected}
            users={users}
            onSave={(patch) => onSavePatch(selected.id, patch)}
            onDelete={() => onDelete(selected)}
            onAddMember={(uid) => onAddMember(selected.id, uid)}
            onRemoveMember={(uid) => onRemoveMember(selected.id, uid)}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
            No group selected.
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ */
/* Create group card                                              */
/* ------------------------------------------------------------ */

function CreateGroupCard({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (payload: {
    name: string;
    slug?: string;
    description?: string;
    isPrivate?: boolean;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit = name.trim().length >= 2 && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    await onCreate({
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      isPrivate,
    });
    setBusy(false);
  };

  return (
    <section className="rounded-2xl border border-fellowship-navy/30 bg-white p-5 md:p-6">
      <h2 className="text-base font-semibold text-gray-800">New forum group</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Name *">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Capstone Mentees"
            className={inputCls}
          />
        </Field>
        <Field label="Slug (optional)">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generated from name"
            className={inputCls}
          />
        </Field>
        <Field label="Description" className="md:col-span-2">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What conversations belong here?"
            className={inputCls}
          />
        </Field>
        <Field label="" className="md:col-span-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-fellowship-navy"
            />
            Private — hidden from non-members. Only members see this group exists.
          </label>
        </Field>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" variant="fellowship" onClick={submit} disabled={!canSubmit}>
          {busy ? "Creating…" : "Create group"}
        </Button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ */
/* Group detail pane                                              */
/* ------------------------------------------------------------ */

function GroupDetailPane({
  group,
  users,
  onSave,
  onDelete,
  onAddMember,
  onRemoveMember,
}: {
  group: ForumGroup;
  users: AdminUser[];
  onSave: (patch: { name?: string; description?: string; isPrivate?: boolean }) => Promise<void>;
  onDelete: () => Promise<void>;
  onAddMember: (userId: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
}) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const [isPrivate, setIsPrivate] = useState(group.isPrivate);
  const [savingMeta, setSavingMeta] = useState(false);
  const [search, setSearch] = useState("");

  // Reset locals when the selected group changes.
  React.useEffect(() => {
    setName(group.name);
    setDescription(group.description ?? "");
    setIsPrivate(group.isPrivate);
  }, [group.id, group.name, group.description, group.isPrivate]);

  const dirty =
    name !== group.name ||
    description !== (group.description ?? "") ||
    isPrivate !== group.isPrivate;

  const submitMeta = async () => {
    if (!dirty) return;
    setSavingMeta(true);
    await onSave({
      name: name !== group.name ? name : undefined,
      description: description !== (group.description ?? "") ? description : undefined,
      isPrivate: isPrivate !== group.isPrivate ? isPrivate : undefined,
    });
    setSavingMeta(false);
  };

  // The directory list doesn't include per-group members, so the
  // "current members" view here lists everyone the admin has the
  // option to remove. v2 should add a `GET /forum/groups/:id/members`
  // endpoint to populate this exactly; for now we offer add/remove
  // controls per user without showing a list (admins know who they
  // added).
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users.slice(0, 30);
    return users
      .filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [users, search]);

  return (
    <section className="flex flex-col gap-4">
      {/* Metadata */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {group.name}
              {group.isDefault && (
                <span className="ml-2 align-middle">
                  <Badge color="info" variant="light">
                    default
                  </Badge>
                </span>
              )}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Slug: <code className="rounded bg-gray-100 px-1">{group.slug}</code> ·
              {" "}
              {group.memberCount} members · {group.threadCount} threads
            </p>
          </div>
          <button
            type="button"
            onClick={onDelete}
            disabled={group.isDefault}
            title={
              group.isDefault
                ? "The default group can't be deleted."
                : "Delete this group"
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-error-600 transition-colors hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <TrashBinIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Description" className="md:col-span-2">
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="(optional)"
              className={inputCls}
            />
          </Field>
          <Field label="" className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isPrivate}
                disabled={group.isDefault}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-fellowship-navy"
              />
              Private (hidden from non-members)
              {group.isDefault && (
                <span className="text-xs text-gray-500">
                  — disabled for the default group
                </span>
              )}
            </label>
          </Field>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            size="sm"
            variant="fellowship"
            onClick={submitMeta}
            disabled={!dirty || savingMeta}
          >
            {savingMeta ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      {/* Membership */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <h3 className="text-base font-semibold text-gray-800">Members</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add or remove fellows, mentors, faculty, or admins. The
          system shows the {group.memberCount} current members in
          aggregate; per-user listing is coming.
        </p>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className={`mt-4 ${inputCls}`}
        />

        <ul className="mt-3 flex flex-col gap-2">
          {filteredUsers.map((u) => (
            <li
              key={u.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">
                  {u.fullName}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {u.email} · {u.role}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddMember(u.id)}
              >
                Add
              </Button>
              {!group.isDefault && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRemoveMember(u.id)}
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
          {filteredUsers.length === 0 && (
            <li className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-center text-xs text-gray-500">
              No matches.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ */

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </label>
      )}
      <div className="mt-1">{children}</div>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-fellowship-navy focus:outline-hidden focus:ring-3 focus:ring-fellowship-navy/10";
