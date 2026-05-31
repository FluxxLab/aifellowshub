"use client";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { registerErrorModalHandler } from "@/lib/error-modal";

export default function ErrorModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<string | undefined>();

  useEffect(() => {
    registerErrorModalHandler((t, d) => {
      setTitle(t);
      setDescription(d);
      setOpen(true);
    });
  }, []);

  return (
    <Modal
      isOpen={open}
      onClose={() => setOpen(false)}
      className="m-4 max-w-sm p-6 text-center"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-error-50">
        <svg
          className="h-7 w-7 text-error-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h3 className="mt-4 text-base font-bold text-gray-800">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}
      <Button
        variant="fellowship"
        size="sm"
        className="mt-5 w-full"
        onClick={() => setOpen(false)}
      >
        OK
      </Button>
    </Modal>
  );
}
