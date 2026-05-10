import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AvatarText from "./AvatarText";

/**
 * AvatarText derives its initials and colour from the user's name. The
 * colour function must be deterministic — we'd otherwise see flicker as
 * the avatar re-mounts. Pin the contract so a "let's hash it differently"
 * refactor doesn't quietly change every cached avatar.
 */
describe("AvatarText", () => {
  it("renders two-letter initials for multi-word names", () => {
    render(<AvatarText name="Ada Lovelace" />);
    expect(screen.getByLabelText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("falls back to first two letters for a single-word name", () => {
    render(<AvatarText name="Ngozi" />);
    expect(screen.getByText("NG")).toBeInTheDocument();
  });

  it("renders ? for an empty name (no crash on bad data)", () => {
    render(<AvatarText name="" />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("assigns the same palette class to the same name across renders", () => {
    const { unmount } = render(<AvatarText name="Sara Adekunle" />);
    const first = screen.getByLabelText("Sara Adekunle").className;
    unmount();
    render(<AvatarText name="Sara Adekunle" />);
    const second = screen.getByLabelText("Sara Adekunle").className;
    expect(first).toBe(second);
  });

  it("forwards extra props to the underlying div", () => {
    render(<AvatarText name="Tunde" data-tour="avatar" />);
    expect(screen.getByLabelText("Tunde")).toHaveAttribute(
      "data-tour",
      "avatar",
    );
  });
});
