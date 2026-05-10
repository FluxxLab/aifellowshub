import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Spinner from "./Spinner";

/**
 * The Spinner replaced ~10 ad-hoc inline spinners around the app, so
 * its contract matters: a screen-reader announcement, the right size
 * mapping, and pass-through for native attributes (data-testid, aria-*,
 * class merging) so callers don't get caught wrapping it in a span.
 */
describe("Spinner", () => {
  it("announces itself to assistive tech via role=status + sr-only label", () => {
    render(<Spinner />);
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute("aria-live", "polite");
    // Default label is "Loading…" rendered into an sr-only span.
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("uses a custom label when supplied", () => {
    render(<Spinner label="Loading dashboard…" />);
    expect(screen.getByText("Loading dashboard…")).toBeInTheDocument();
  });

  it("applies the right size class for sm / md / lg", () => {
    const { rerender } = render(<Spinner size="sm" data-testid="sp" />);
    expect(screen.getByTestId("sp").querySelector(":scope > span")?.className).toContain("h-4");

    rerender(<Spinner size="md" data-testid="sp" />);
    expect(screen.getByTestId("sp").querySelector(":scope > span")?.className).toContain("h-6");

    rerender(<Spinner size="lg" data-testid="sp" />);
    expect(screen.getByTestId("sp").querySelector(":scope > span")?.className).toContain("h-10");
  });

  it("forwards arbitrary HTML attributes to the wrapper span", () => {
    render(<Spinner data-testid="quota-spinner" aria-describedby="hint" />);
    const el = screen.getByTestId("quota-spinner");
    expect(el).toHaveAttribute("aria-describedby", "hint");
  });

  it("merges caller className with the layout defaults", () => {
    render(<Spinner data-testid="sp" className="ml-2 text-pic-yellow" />);
    const el = screen.getByTestId("sp");
    expect(el.className).toContain("ml-2");
    expect(el.className).toContain("text-pic-yellow");
    // Layout defaults still present.
    expect(el.className).toContain("inline-flex");
  });
});
