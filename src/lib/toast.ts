/**
 * Toast wrapper — thin layer over sonner with three goals:
 *   1. Single import path (`@/lib/toast`) so call sites don't reach into sonner directly.
 *   2. Sensible defaults (titles vs descriptions, durations).
 *   3. `errorFromException` — turns a thrown ApiError or Error into a clean
 *      title + description without callers having to instanceof-check.
 */
import { toast as sonner } from "sonner";
import { ApiError } from "./api/client";

export const toast = {
  success(title: string, description?: string) {
    sonner.success(title, { description });
  },

  error(title: string, description?: string) {
    sonner.error(title, { description });
  },

  info(title: string, description?: string) {
    sonner.info(title, { description });
  },

  /**
   * Format any thrown value into an error toast. Use it in catch blocks so
   * the call site stays one line:
   *
   *   catch (err) { toast.errorFromException("Couldn't save", err) }
   *
   * Hides 401s by default — those get redirected by `getCurrentUser` and
   * surfacing the raw error doubles up on user feedback.
   */
  errorFromException(title: string, err: unknown) {
    if (err instanceof ApiError) {
      if (err.status === 401) return;
      sonner.error(title, { description: err.message });
      return;
    }
    if (err instanceof Error) {
      sonner.error(title, { description: err.message });
      return;
    }
    sonner.error(title, { description: "Please try again." });
  },
};
