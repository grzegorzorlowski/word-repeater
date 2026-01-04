import { describe, it, expect } from "vitest";
import { render } from "@/test/utils/test-utils";
import InlineLoader from "../InlineLoader";

describe("InlineLoader", () => {
  it("renders spinner when visible is true", () => {
    const { container } = render(<InlineLoader visible={true} />);
    const spinnerElement = container.querySelector(".animate-spin");
    expect(spinnerElement).toBeInTheDocument();
  });

  it("does not render when visible is false", () => {
    const { container } = render(<InlineLoader visible={false} />);
    const spinnerElement = container.querySelector(".animate-spin");
    expect(spinnerElement).not.toBeInTheDocument();
  });

  it("has proper ARIA attributes", () => {
    const { container } = render(<InlineLoader visible={true} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("applies correct animation class", () => {
    const { container } = render(<InlineLoader visible={true} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("animate-spin");
  });
});
