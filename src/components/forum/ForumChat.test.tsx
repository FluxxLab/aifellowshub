import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * ForumChat is the group-chat component fellows + admins use to talk
 * across cohort groups. The contracts worth pinning:
 *
 *   - First-render picks a group the user is a member of (not just the
 *     first group in the list — this is what kept "General" from
 *     showing as default once cohort-private groups got added).
 *   - Switching groups re-fetches messages (the loader fires keyed on
 *     activeGroupId).
 *   - Send adds the new message to the bottom and clears the draft.
 *   - The composer's placeholder reflects join state — fellows
 *     non-members of a group see "Join this group before posting".
 */

const {
  listForumMessagesMock,
  sendForumMessageMock,
  toastErrorFromException,
} = vi.hoisted(() => ({
  listForumMessagesMock: vi.fn(),
  sendForumMessageMock: vi.fn(),
  toastErrorFromException: vi.fn(),
}));

vi.mock("@/lib/api/fellow-forum", () => ({
  listForumMessages: listForumMessagesMock,
  sendForumMessage: sendForumMessageMock,
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
    errorFromException: toastErrorFromException,
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import ForumChat from "./ForumChat";

const groups = [
  {
    id: "g-general",
    name: "General",
    slug: "general",
    isMember: true,
    isDefault: true,
    isPrivate: false,
    description: null,
  },
  {
    id: "g-cohort-2026",
    name: "Cohort 2026",
    slug: "cohort-2026",
    isMember: true,
    isDefault: false,
    isPrivate: false,
    description: null,
  },
  {
    id: "g-private",
    name: "Mentor lounge",
    slug: "mentor-lounge",
    isMember: false,
    isDefault: false,
    isPrivate: false,
    description: null,
  },
];

const generalMessage = {
  id: "m-1",
  groupId: "g-general",
  body: "welcome everyone",
  author: {
    id: "u-2",
    fullName: "Sara Adekunle",
    avatarUrl: null,
  },
  createdAt: "2026-05-01T10:00:00Z",
};

const cohortMessage = {
  id: "m-2",
  groupId: "g-cohort-2026",
  body: "session at 4pm tomorrow",
  author: {
    id: "u-3",
    fullName: "Tunde Ogun",
    avatarUrl: null,
  },
  createdAt: "2026-05-01T11:00:00Z",
};

beforeEach(() => {
  listForumMessagesMock.mockReset();
  sendForumMessageMock.mockReset();
  toastErrorFromException.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("ForumChat", () => {
  it("loads messages for the first joined group on mount", async () => {
    listForumMessagesMock.mockResolvedValueOnce([generalMessage]);
    render(<ForumChat groups={groups} />);

    // First call should be for the default joined group.
    await waitFor(() => {
      expect(listForumMessagesMock).toHaveBeenCalledWith("g-general");
    });
    expect(await screen.findByText("welcome everyone")).toBeInTheDocument();
  });

  it("re-fetches when the user switches groups", async () => {
    listForumMessagesMock.mockResolvedValueOnce([generalMessage]);
    render(<ForumChat groups={groups} />);
    await screen.findByText("welcome everyone");

    listForumMessagesMock.mockResolvedValueOnce([cohortMessage]);
    await userEvent.click(screen.getByRole("button", { name: /Cohort 2026/i }));

    await waitFor(() => {
      expect(listForumMessagesMock).toHaveBeenCalledWith("g-cohort-2026");
    });
    expect(await screen.findByText(/session at 4pm/i)).toBeInTheDocument();
  });

  it("appends sent messages to the bottom and clears the draft", async () => {
    listForumMessagesMock.mockResolvedValueOnce([generalMessage]);
    sendForumMessageMock.mockResolvedValueOnce({
      id: "m-new",
      groupId: "g-general",
      body: "hi from Ada",
      author: {
        id: "u-1",
        fullName: "Ada Lovelace",
        avatarUrl: null,
      },
      createdAt: "2026-05-01T12:00:00Z",
    });

    render(<ForumChat groups={groups} />);
    const composer = (await screen.findByPlaceholderText(
      /Message #general/i,
    )) as HTMLTextAreaElement;

    await userEvent.type(composer, "hi from Ada");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(await screen.findByText("hi from Ada")).toBeInTheDocument();
    await waitFor(() => {
      expect(composer.value).toBe("");
    });
    expect(sendForumMessageMock).toHaveBeenCalledWith(
      "g-general",
      "hi from Ada",
    );
  });

  it("shows a 'join group' placeholder when a non-member group is active", async () => {
    listForumMessagesMock.mockResolvedValue([]);
    render(<ForumChat groups={groups} />);
    // Wait for first render to finish.
    await screen.findByPlaceholderText(/Message #general/i);

    await userEvent.click(
      screen.getByRole("button", { name: /Mentor lounge/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Join this group before posting/i),
      ).toBeInTheDocument();
    });
  });

  it("surfaces a toast when send fails (and does not clear the draft)", async () => {
    listForumMessagesMock.mockResolvedValueOnce([generalMessage]);
    sendForumMessageMock.mockRejectedValueOnce(new Error("Server error"));

    render(<ForumChat groups={groups} />);
    const composer = (await screen.findByPlaceholderText(
      /Message #general/i,
    )) as HTMLTextAreaElement;

    await userEvent.type(composer, "this should fail");
    await userEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(toastErrorFromException).toHaveBeenCalledTimes(1);
    });
    // Draft preserved so the user can retry without retyping.
    expect(composer.value).toBe("this should fail");
  });
});
