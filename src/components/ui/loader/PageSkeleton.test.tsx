import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PageSkeleton from "./PageSkeleton";

/**
 * PageSkeleton is what every role's `loading.tsx` renders, so its
 * announcement contract — one polite "Loading…" per page transition,
 * not one per shimmer — needs to hold across all three variants.
 */
describe("PageSkeleton", () => {
  it("announces a single role=status with the default label", () => {
    render(<PageSkeleton />);
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("uses a custom label when supplied", () => {
    render(<PageSkeleton label="Loading dashboard…" />);
    expect(screen.getByText("Loading dashboard…")).toBeInTheDocument();
  });

  it("renders four stat tiles in the dashboard variant", () => {
    const { container } = render(<PageSkeleton variant="dashboard" />);
    // Four stat tiles each contain a `rounded-full` skeleton (the icon),
    // which the other variants don't render. Counting circles is the
    // most stable assertion against the dashboard shape.
    const circles = container.querySelectorAll(".rounded-full");
    expect(circles.length).toBe(4);
  });

  it("renders six list rows in the list variant", () => {
    const { container } = render(<PageSkeleton variant="list" />);
    // Six h-20 rows are the unique signature of the list variant.
    const rows = container.querySelectorAll(".h-20");
    expect(rows.length).toBe(6);
  });

  it("renders the detail variant with a 2-up content split", () => {
    const { container } = render(<PageSkeleton variant="detail" />);
    expect(container.querySelector(".lg\\:col-span-2")).not.toBeNull();
  });
});
