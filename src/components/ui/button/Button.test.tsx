import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import Button from "./Button";

/**
 * The whole reason Button got refactored: it was swallowing native
 * attributes and forcing callers to wrap it in a `<span data-tour>`.
 * These tests pin the spread + ref-forwarding contract so that doesn't
 * regress.
 */
describe("Button", () => {
  it("forwards arbitrary HTML attributes to the underlying button", () => {
    render(
      <Button data-tour="invite" aria-label="Invite a teammate">
        Invite
      </Button>,
    );
    const btn = screen.getByRole("button", { name: /invite a teammate/i });
    expect(btn).toHaveAttribute("data-tour", "invite");
  });

  it("forwards a ref to the underlying button element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Hi</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current?.textContent).toContain("Hi");
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Click me
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("defaults type to button (not submit) so it doesn't submit forms unintentionally", () => {
    render(<Button>Hi</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("appends caller className without dropping variant + size styles", () => {
    render(<Button className="custom-class">Hi</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("custom-class");
    // Default variant = primary
    expect(btn.className).toContain("bg-brand-500");
    // Default size = md
    expect(btn.className).toContain("py-3.5");
  });
});
