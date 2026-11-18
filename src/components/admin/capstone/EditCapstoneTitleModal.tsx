"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";

const MIN_LENGTH = 2;
const MAX_LENGTH = 200;

/** Admin corrects a capstone title via PATCH /capstones/:id/title. */
export default function EditCapstoneTitleModal({
  isOpen,
  onClose,
  capstoneId,
  fellowName,
  currentTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  capstoneId: string;
  fellowName: string;
  currentTitle: string | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(currentTitle ?? "");
  const [saving, setSaving] = useState(false);

  // Start from the saved title each time, discarding any abandoned edit.
  useEffect(() => {
    if (isOpen) setTitle(currentTitle ?? "");
  }, [isOpen, currentTitle]);

  const trimmed = title.trim();
  const tooLong = trimmed.length > MAX_LENGTH;
  const canSave =
    trimmed.length >= MIN_LENGTH &&
    !tooLong &&
    trimmed !== (currentTitle ?? "") &&
    !saving;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await apiFetch(`/capstones/${encodeURIComponent(capstoneId)}/title`, {
        method: "PATCH",
        body: { title: trimmed },
      });
      toast.success("Title updated", `${fellowName} has been notified.`);
      router.refresh();
      onClose();
    } catch (err) {
      toast.errorFromException("Couldn't update the title", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-lg p-6 sm:p-8">
      <h2 className="text-title-sm font-bold text-gray-800">
        Edit capstone title
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        This changes the title on{" "}
        <span className="font-semibold text-gray-700">{fellowName}</span>
        &apos;s capstone and on their certificate, if one has been issued.
      </p>

      <form onSubmit={handleSubmit} className="mt-5">
        <Label htmlFor="capstone-title">Title</Label>
        <Input
          id="capstone-title"
          defaultValue={currentTitle ?? ""}
          onChange={(e) => setTitle(e.target.value)}
          error={tooLong}
          hint={`${trimmed.length}/${MAX_LENGTH} characters`}
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            variant="fellowship"
            disabled={!canSave}
            className="bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
          >
            {saving ? "Saving…" : "Save title"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
