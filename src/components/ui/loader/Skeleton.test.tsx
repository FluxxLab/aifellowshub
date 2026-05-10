import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Skeleton from "./Skeleton";

/**
 * Skeleton is the design-system replacement for the half-dozen
 * `<div className="animate-pulse bg-gray-200">` patterns scattered
 * across loading states. The contract is small but worth pinning:
 * decorative role, native prop spread, shape variants, class merge.
 */
describe("Skeleton", () => {
  it("is decorative: aria-hidden so AT users hear the wrapper announcement, not every shimmer", () => {
    render(<Skeleton data-testid="sk" />);
    expect(screen.getByTestId("sk")).toHaveAttribute("aria-hidden");
  });

  it("uses rounded-md for shape=rect (default)", () => {
    render(<Skeleton data-testid="sk" />);
    expect(screen.getByTestId("sk").className).toContain("rounded-md");
  });

  it("uses rounded-full for shape=circle (avatars)", () => {
    render(<Skeleton data-testid="sk" shape="circle" />);
    expect(screen.getByTestId("sk").className).toContain("rounded-full");
  });

  it("merges caller className with the layout defaults", () => {
    render(<Skeleton data-testid="sk" className="h-4 w-32" />);
    const el = screen.getByTestId("sk");
    expect(el.className).toContain("h-4");
    expect(el.className).toContain("w-32");
    expect(el.className).toContain("animate-pulse");
  });

  it("forwards arbitrary HTML attributes", () => {
    render(<Skeleton data-testid="sk" data-tour="loading-card" />);
    expect(screen.getByTestId("sk")).toHaveAttribute(
      "data-tour",
      "loading-card",
    );
  });
});
