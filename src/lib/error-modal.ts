/**
 * Module-level pub/sub so toast.error() can trigger a modal from anywhere
 * without React context. The ErrorModal component registers itself on mount;
 * calls before mount fall back to console.error.
 */
type Handler = (title: string, description?: string) => void;

let _handler: Handler | null = null;

export function registerErrorModalHandler(fn: Handler) {
  _handler = fn;
}

export function emitError(title: string, description?: string) {
  if (_handler) {
    _handler(title, description);
  } else {
    // Modal not mounted yet (e.g. during SSR or early boot) — log only.
    console.error(`[error] ${title}`, description ?? "");
  }
}
