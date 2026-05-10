import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FellowCapstone } from "@/lib/api/fellow-capstone";

/**
 * MyCapstoneView is the heaviest fellow client component (822 lines,
 * 6+ stateful sections, save-then-submit confirm flow). Tests pin the
 * highest-stakes paths:
 *
 *   - Save flow calls `saveFellowCapstone` with the structured draft
 *     fields collapsed to one markdown blob (the contract the backend
 *     expects).
 *   - Submit flow saves first (so the mentor reads the freshest draft)
 *     then calls `submitFellowCapstone` and refreshes the route.
 *   - Submit refuses when the problem statement is too short (BRD
 *     §6.10 "needs ≥ 10 chars before mentor review").
 *   - Save failure surfaces a toast and doesn't lock the UI.
 *
 * Phase-2 mocks like the assignment toggle and feedback reply are
 * client-only state — out of scope for these tests.
 */

const {
  saveFellowCapstoneMock,
  submitFellowCapstoneMock,
  toastError,
  toastErrorFromException,
  toastSuccess,
  routerRefresh,
  confirmMock,
} = vi.hoisted(() => ({
  saveFellowCapstoneMock: vi.fn(),
  submitFellowCapstoneMock: vi.fn(),
  toastError: vi.fn(),
  toastErrorFromException: vi.fn(),
  toastSuccess: vi.fn(),
  routerRefresh: vi.fn(),
  confirmMock: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/api/fellow-capstone", async () => {
  // Re-export the type module's public types from the real file so the
  // component sees the same shape, but stub the writes.
  const actual =
    await vi.importActual<typeof import("@/lib/api/fellow-capstone")>(
      "@/lib/api/fellow-capstone",
    );
  return {
    ...actual,
    saveFellowCapstone: saveFellowCapstoneMock,
    submitFellowCapstone: submitFellowCapstoneMock,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh, push: vi.fn() }),
}));

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
  useConfirm: () => ({ confirm: confirmMock, dialog: null }),
}));

import MyCapstoneView from "./MyCapstoneView";

const baseCapstone: FellowCapstone = {
  status: "draft",
  title: "Algorithmic accountability for credit scoring",
  oneliner: "Sub-Saharan credit scoring",
  sector: "finance",
  mentor: {
    id: "m-1",
    fullName: "Tunde Ogun",
    role: "Mentor",
    bio: null,
    avatarUrl: null,
  },
  draft: {
    problem:
      "Sub-Saharan credit-scoring models systematically under-rate informal-economy borrowers, locking them out of formal finance.",
    approach: "Audit + redress framework.",
    stakeholders: "Two regulators, three lenders.",
    deliverables: "Policy brief + audit checklist.",
    risks: "Lender data access.",
    lastSavedAt: "2026-05-01T10:00:00Z",
  },
  milestones: [],
  consultations: [],
  feedback: [],
  assignments: [],
  submittedAt: null,
  approvedAt: null,
};

const savedShape = {
  id: "c-1",
  title: baseCapstone.title,
  problemStatement: baseCapstone.draft.problem,
  status: "draft" as const,
  stage: "scoping" as const,
  lastSubmittedAt: null,
  finalApprovedAt: null,
  updatedAt: "2026-05-10T09:00:00Z",
};

beforeEach(() => {
  saveFellowCapstoneMock.mockReset();
  submitFellowCapstoneMock.mockReset();
  toastError.mockReset();
  toastErrorFromException.mockReset();
  toastSuccess.mockReset();
  routerRefresh.mockReset();
  confirmMock.mockReset().mockResolvedValue(true);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("MyCapstoneView", () => {
  it("Save draft sends the structured fields collapsed to a single content blob", async () => {
    saveFellowCapstoneMock.mockResolvedValueOnce(savedShape);
    render(<MyCapstoneView capstone={baseCapstone} />);

    await userEvent.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => {
      expect(saveFellowCapstoneMock).toHaveBeenCalledTimes(1);
    });
    const payload = saveFellowCapstoneMock.mock.calls[0][0];
    expect(payload.title).toBe(baseCapstone.title);
    expect(payload.problemStatement).toBe(baseCapstone.draft.problem);
    // The four secondary fields concat into the one `content` markdown.
    expect(payload.content).toContain("## Approach");
    expect(payload.content).toContain("## Stakeholders");
    expect(payload.content).toContain("## Deliverables");
    expect(payload.content).toContain("## Risks & limitations");
  });

  it("Submit refuses when the problem statement is shorter than 10 chars", async () => {
    const stub: FellowCapstone = {
      ...baseCapstone,
      draft: { ...baseCapstone.draft, problem: "too short" }, // 9 chars
    };
    render(<MyCapstoneView capstone={stub} />);

    await userEvent.click(
      screen.getByRole("button", { name: /submit for review/i }),
    );

    expect(toastError).toHaveBeenCalledWith(
      "Add a problem statement",
      expect.stringMatching(/brief framing/i),
    );
    expect(saveFellowCapstoneMock).not.toHaveBeenCalled();
    expect(submitFellowCapstoneMock).not.toHaveBeenCalled();
  });

  it("Submit saves first, then submits, then refreshes the route", async () => {
    saveFellowCapstoneMock.mockResolvedValueOnce(savedShape);
    submitFellowCapstoneMock.mockResolvedValueOnce({
      ...savedShape,
      status: "under-review",
      lastSubmittedAt: "2026-05-10T09:00:30Z",
    });
    render(<MyCapstoneView capstone={baseCapstone} />);

    await userEvent.click(
      screen.getByRole("button", { name: /submit for review/i }),
    );

    await waitFor(() => {
      expect(saveFellowCapstoneMock).toHaveBeenCalledTimes(1);
      expect(submitFellowCapstoneMock).toHaveBeenCalledTimes(1);
    });
    // Save must precede submit so the mentor sees the latest draft.
    expect(saveFellowCapstoneMock.mock.invocationCallOrder[0]).toBeLessThan(
      submitFellowCapstoneMock.mock.invocationCallOrder[0],
    );
    expect(routerRefresh).toHaveBeenCalledTimes(1);
    expect(toastSuccess).toHaveBeenCalledWith(
      "Submitted",
      expect.stringMatching(/mentor has the latest/i),
    );
  });

  it("Submit short-circuits if the user cancels the confirm dialog", async () => {
    confirmMock.mockResolvedValueOnce(false);
    render(<MyCapstoneView capstone={baseCapstone} />);

    await userEvent.click(
      screen.getByRole("button", { name: /submit for review/i }),
    );

    expect(saveFellowCapstoneMock).not.toHaveBeenCalled();
    expect(submitFellowCapstoneMock).not.toHaveBeenCalled();
  });

  it("Save failure surfaces a toast and re-enables the button", async () => {
    saveFellowCapstoneMock.mockRejectedValueOnce(new Error("Backend down"));
    render(<MyCapstoneView capstone={baseCapstone} />);

    const saveBtn = screen.getByRole("button", { name: /save draft/i });
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(toastErrorFromException).toHaveBeenCalledTimes(1);
    });
    // Button is back to "Save draft" (not stuck on "Saving…").
    await waitFor(() => {
      expect(
        within(saveBtn).queryByText(/Saving…|Saved/i),
      ).not.toBeInTheDocument();
    });
  });
});
