import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * AiBuddyChat is the heaviest fellow-facing client component (~460
 * lines, async fetch on mount + send round-trip + quota + reset). The
 * tests focus on the contracts that would surface as user-visible
 * regressions:
 *
 *   - First render shows the canned greeting when the conversation is
 *     empty (the BRD §6.7 onboarding moment).
 *   - The textarea + send button are disabled when quota is exhausted
 *     (the rate limit is server-enforced but the UI must mirror it).
 *   - Send adds a user bubble immediately (optimistic) and then
 *     replaces it with the assistant's reply.
 *   - Send failure rolls the optimistic bubble back and restores the
 *     draft so the user doesn't lose what they typed.
 *
 * Lower-level concerns (markdown rendering, scroll-to-bottom) are
 * implementation detail and skipped here.
 */

// `vi.mock` factories are hoisted above all imports, so any vi.fn() refs
// inside them must come from `vi.hoisted` rather than module-level `const`.
const {
  getAiBuddyMock,
  sendAiMessageMock,
  resetAiBuddyMock,
  toastError,
  toastErrorFromException,
  toastSuccess,
} = vi.hoisted(() => ({
  getAiBuddyMock: vi.fn(),
  sendAiMessageMock: vi.fn(),
  resetAiBuddyMock: vi.fn(),
  toastError: vi.fn(),
  toastErrorFromException: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/lib/api/ai-buddy", async () => {
  // Real ApiError so the component's `instanceof ApiError` check works.
  class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return {
    getAiBuddy: getAiBuddyMock,
    sendAiMessage: sendAiMessageMock,
    resetAiBuddy: resetAiBuddyMock,
    ApiError,
  };
});

vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => ({
    id: "u-1",
    fullName: "Ada Lovelace",
    email: "ada@example.test",
    role: "fellow" as const,
    avatarUrl: "/images/user/owner.jpg",
    mustChangePassword: false,
  }),
}));

vi.mock("@/lib/toast", () => ({
  toast: {
    error: toastError,
    errorFromException: toastErrorFromException,
    success: toastSuccess,
  },
}));

vi.mock("@/components/ui/ConfirmDialog", () => ({
  // Auto-confirm so onReset proceeds without a real dialog.
  useConfirm: () => ({
    confirm: vi.fn().mockResolvedValue(true),
    dialog: null,
  }),
}));

// Import AFTER the mocks are wired so the module picks them up.
import AiBuddyChat from "./AiBuddyChat";

beforeEach(() => {
  getAiBuddyMock.mockReset();
  sendAiMessageMock.mockReset();
  resetAiBuddyMock.mockReset();
  toastError.mockReset();
  toastErrorFromException.mockReset();
  toastSuccess.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

const FRESH_STATE = {
  conversation: { messages: [] },
  quota: { used: 0, limit: 20, remaining: 20 },
};

describe("AiBuddyChat", () => {
  it("renders the canned greeting when the backend returns no messages", async () => {
    getAiBuddyMock.mockResolvedValueOnce(FRESH_STATE);
    render(<AiBuddyChat />);
    // Greeting text is rendered through react-markdown, which may split
    // across nodes. Match on a stable phrase from the greeting body.
    expect(
      await screen.findByText(/study companion/i, { exact: false }),
    ).toBeInTheDocument();
  });

  it("shows the daily quota in the header badge", async () => {
    getAiBuddyMock.mockResolvedValueOnce({
      conversation: { messages: [] },
      quota: { used: 5, limit: 20, remaining: 15 },
    });
    render(<AiBuddyChat />);
    // QuotaBadge splits the count + "/ 20" across two spans, so match
    // each piece independently.
    await waitFor(() => {
      expect(screen.getByText("15")).toBeInTheDocument();
    });
    expect(screen.getByText(/\/\s*20/)).toBeInTheDocument();
  });

  it("disables the send button when the daily quota is exhausted", async () => {
    getAiBuddyMock.mockResolvedValueOnce({
      conversation: { messages: [] },
      quota: { used: 20, limit: 20, remaining: 0 },
    });
    render(<AiBuddyChat />);
    await waitFor(() => {
      const sendBtn = screen.getByRole("button", { name: /send/i });
      expect(sendBtn).toBeDisabled();
    });
    // And the textarea placeholder reflects the rate-limit state.
    expect(
      screen.getByPlaceholderText(/reached today's limit/i),
    ).toBeInTheDocument();
  });

  it("optimistically renders the user's bubble before the backend replies", async () => {
    getAiBuddyMock.mockResolvedValueOnce(FRESH_STATE);
    sendAiMessageMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          // Delay so we can assert on the optimistic state.
          setTimeout(
            () =>
              resolve({
                message: {
                  id: "m-2",
                  role: "assistant",
                  content: "Sure, here's the gist…",
                  stubbed: false,
                  createdAt: new Date().toISOString(),
                },
                quota: { used: 1, limit: 20, remaining: 19 },
              }),
            50,
          );
        }),
    );

    render(<AiBuddyChat />);
    // Wait for the post-fetch UI before typing.
    await screen.findByPlaceholderText(/Ask AI Buddy/i);

    const textarea = screen.getByPlaceholderText(/Ask AI Buddy/i);
    await userEvent.type(textarea, "What's a model card?");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    // Optimistic user bubble.
    expect(
      await screen.findByText("What's a model card?"),
    ).toBeInTheDocument();
    // Eventually the assistant reply lands.
    expect(
      await screen.findByText(/Sure, here's the gist/i),
    ).toBeInTheDocument();
  });

  it("rolls back the optimistic bubble and restores the draft on send failure", async () => {
    getAiBuddyMock.mockResolvedValueOnce(FRESH_STATE);
    sendAiMessageMock.mockRejectedValueOnce(new Error("Network down"));

    render(<AiBuddyChat />);
    const textarea = (await screen.findByPlaceholderText(
      /Ask AI Buddy/i,
    )) as HTMLTextAreaElement;
    await userEvent.type(textarea, "Will this fail?");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    // Wait for the toast — fired only after the catch branch runs, so
    // it's a reliable signal that the rollback has happened.
    await waitFor(() => {
      expect(toastErrorFromException).toHaveBeenCalledTimes(1);
    });

    // Draft is restored so the user can retry.
    expect(textarea.value).toBe("Will this fail?");

    // The optimistic bubble is no longer rendered. The textarea also
    // contains "Will this fail?", so we check that the bubble's
    // wrapping container (a `.prose-chat` markdown body) doesn't
    // include the phrase.
    expect(document.querySelector(".prose-chat")?.textContent ?? "").not
      .toContain("Will this fail?");
  });
});
