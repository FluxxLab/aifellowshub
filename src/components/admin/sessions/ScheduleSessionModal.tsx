"use client";
import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import SelectField from "@/components/form/SelectField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { CheckCircleIcon } from "@/icons";
import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";

type ScheduleSessionModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type AdminModule = {
  id: string;
  title: string;
  weekNumber: number;
  status: "draft" | "in_review" | "published";
};

type FacultyOption = {
  id: string;
  fullName: string;
};

export default function ScheduleSessionModal({
  isOpen,
  onClose,
}: ScheduleSessionModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [duration, setDuration] = useState(90);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [faculty, setFaculty] = useState<FacultyOption[]>([]);
  const [loadingFaculty, setLoadingFaculty] = useState(true);
  const [facultyFetchFailed, setFacultyFetchFailed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    apiFetch<{ modules: AdminModule[] }>("/modules")
      .then((res) => {
        if (cancelled) return;
        setModules(res.modules);
        if (res.modules[0]) setModuleId(res.modules[0].id);
        setLoadingModules(false);
      })
      .catch(() => {
        if (!cancelled) setLoadingModules(false);
      });
    apiFetch<{ faculty: FacultyOption[] }>("/admin/faculty")
      .then((res) => {
        if (cancelled) return;
        setFaculty(res.faculty);
        setLoadingFaculty(false);
      })
      .catch(() => {
        // Distinguish "endpoint missing/down" from "no faculty exist"
        // so the empty-state copy below can guide the admin to the
        // right action (redeploy backend vs. invite a faculty user).
        if (cancelled) return;
        setFacultyFetchFailed(true);
        setLoadingFaculty(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const canSubmit =
    title.trim().length > 1 &&
    moduleId.length > 0 &&
    startsAt.length > 0 &&
    duration > 0 &&
    !submitting;

  const reset = () => {
    setTitle("");
    setModuleId(modules[0]?.id ?? "");
    setTeacherId("");
    setStartsAt("");
    setDuration(90);
    setSubmitted(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await apiFetch(`/modules/${encodeURIComponent(moduleId)}/session`, {
        method: "POST",
        body: {
          title: title.trim(),
          startsAt: new Date(startsAt).toISOString(),
          durationMinutes: duration,
          // Optional — falls back to "no teacher" when admin runs the
          // session themselves (orientation, summit, etc.).
          teacherId: teacherId || undefined,
        },
      });
      setSubmitted(true);
      toast.success("Session scheduled", `${title.trim()} is on the calendar.`);
      router.refresh();
    } catch (err) {
      toast.errorFromException("Couldn't schedule session", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="m-4 max-w-lg">
      {submitted ? (
        <div className="p-6 text-center sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-success-100">
            <CheckCircleIcon className="h-8 w-8 text-success-600" />
          </div>
          <h2 className="mb-2 text-title-sm font-bold text-gray-800">
            Session scheduled
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-gray-500">
            Fellows will get a calendar invite and reminders at T-24h, T-1h,
            and T-5min.
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
            <Button variant="outline" size="sm" onClick={reset}>
              Schedule another
            </Button>
            <Button variant="fellowship" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-title-sm font-bold text-gray-800">
              Schedule a session
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Live sessions are not recorded. Fellows who miss can complete the
              module via the assessment.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <Label>
                Title <span className="text-error-500">*</span>
              </Label>
              <Input
                type="text" placeholder="e.g. Office hours · Capstone scoping" defaultValue={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label>
                Module <span className="text-error-500">*</span>
              </Label>
              <SelectField
                value={moduleId}
                onChange={setModuleId}
                placeholder={loadingModules ? "Loading modules…" : "Choose a module"}
                options={modules.map((m) => ({
                  value: m.id,
                  label: `Week ${m.weekNumber} · ${m.title}`,
                }))}
              />
            </div>

            <div>
              <Label>Teacher</Label>
              <SelectField
                value={teacherId}
                onChange={setTeacherId}
                placeholder={
                  loadingFaculty
                    ? "Loading faculty…"
                    : faculty.length === 0
                      ? "No faculty available — admin will run this one"
                      : "No teacher (admin runs the session)"
                }
                options={faculty.map((f) => ({ value: f.id, label: f.fullName }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>
                  Starts at <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="datetime-local" defaultValue={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div>
                <Label>
                  Duration (min) <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="number" defaultValue={String(duration)}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min="15" step={5}
                />
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="fellowship" size="sm" type="submit" disabled={!canSubmit}
            >
              {submitting ? "Scheduling…" : "Schedule session"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
