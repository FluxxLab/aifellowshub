"use client";
import React, { useCallback, useState } from "react";
import { Modal } from "./modal";
import Button from "./button/Button";

type Tone = "danger" | "default";

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" paints the confirm button red — use for destructive actions. */
  tone?: Tone;
};

type NoticeOptions = {
  title: string;
  message?: string;
  okLabel?: string;
};

type DialogState =
  | { kind: "confirm"; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: "notice"; opts: NoticeOptions; resolve: () => void }
  | null;

/**
 * Imperative confirm/notice dialogs as a hook so call sites stay ergonomic:
 *
 *     const { confirm, notice, dialog } = useConfirm();
 *     // ...
 *     if (!(await confirm({ title: "Delete?", tone: "danger" }))) return;
 *     // render `{dialog}` once at the bottom of the component.
 *
 * Replaces `window.confirm` / `window.alert` so we never fall back to the
 * browser's native chrome — keeps the design system consistent.
 */
export function useConfirm() {
  const [state, setState] = useState<DialogState>(null);

  // confirm/notice are stable so consumers can store them in deps lists.
  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setState({ kind: "confirm", opts, resolve });
      }),
    [],
  );

  const notice = useCallback(
    (opts: NoticeOptions) =>
      new Promise<void>((resolve) => {
        setState({ kind: "notice", opts, resolve });
      }),
    [],
  );

  // dismiss/settle* close over the current `state`. They aren't memoized
  // because the dialog re-renders on every state change anyway, and only
  // the dialog itself uses them.
  const dismiss = () => {
    if (!state) return;
    if (state.kind === "confirm") state.resolve(false);
    else state.resolve();
    setState(null);
  };

  const settleConfirm = (value: boolean) => {
    if (state?.kind !== "confirm") return;
    state.resolve(value);
    setState(null);
  };

  const settleNotice = () => {
    if (state?.kind !== "notice") return;
    state.resolve();
    setState(null);
  };

  const isOpen = state !== null;

  const dialog = (
    <Modal
      isOpen={isOpen}
      onClose={dismiss}
      showCloseButton={false}
      className="m-4 max-w-md"
    >
      {state && (
        <div className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-900">
            {state.opts.title}
          </h3>
          {state.opts.message && (
            <p className="mt-2 text-sm text-gray-600">{state.opts.message}</p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            {state.kind === "confirm" ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => settleConfirm(false)}
                >
                  {state.opts.cancelLabel ?? "Cancel"}
                </Button>
                {state.opts.tone === "danger" ? (
                  <button
                    type="button"
                    onClick={() => settleConfirm(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-error-500 px-4 py-3 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-error-600"
                  >
                    {state.opts.confirmLabel ?? "Delete"}
                  </button>
                ) : (
                  <Button
                    size="sm"
                    variant="fellowship"
                    onClick={() => settleConfirm(true)}
                  >
                    {state.opts.confirmLabel ?? "Confirm"}
                  </Button>
                )}
              </>
            ) : (
              <Button size="sm" variant="fellowship" onClick={settleNotice}>
                {state.opts.okLabel ?? "OK"}
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );

  return { confirm, notice, dialog };
}
