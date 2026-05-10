import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Badge from "./Badge";

describe("Badge", () => {
  it("forwards data-* and aria-* attributes to the rendered span", () => {
    render(
      <Badge data-tour="status" aria-label="Approved">
        Approved
      </Badge>,
    );
    const el = screen.getByLabelText("Approved");
    expect(el).toHaveAttribute("data-tour", "status");
    expect(el.tagName).toBe("SPAN");
  });

  it("merges caller className with variant + colour styles", () => {
    render(
      <Badge color="success" variant="solid" className="ml-2">
        Approved
      </Badge>,
    );
    const el = screen.getByText("Approved");
    expect(el.className).toContain("ml-2");
    expect(el.className).toContain("bg-success-500");
  });

  it("renders start + end icons alongside children", () => {
    render(
      <Badge
        startIcon={<span data-testid="start">★</span>}
        endIcon={<span data-testid="end">→</span>}
      >
        Featured
      </Badge>,
    );
    expect(screen.getByTestId("start")).toBeInTheDocument();
    expect(screen.getByTestId("end")).toBeInTheDocument();
    expect(screen.getByText("Featured")).toBeInTheDocument();
  });
});
