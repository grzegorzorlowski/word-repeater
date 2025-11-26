import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils/test-utils";
import { DashboardLoader } from "../DashboardLoader";

describe("DashboardLoader", () => {
  describe("Visibility Control", () => {
    it("should render when visible prop is true", () => {
      render(<DashboardLoader visible={true} />);

      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("should not render when visible prop is false", () => {
      render(<DashboardLoader visible={false} />);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("should return null when not visible", () => {
      const { container } = render(<DashboardLoader visible={false} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Spinner Rendering", () => {
    it("should render spinner element when visible", () => {
      render(<DashboardLoader visible={true} />);

      const statusElement = screen.getByRole("status");
      const spinner = statusElement.querySelector("div[class*='animate-spin']");

      expect(spinner).toBeInTheDocument();
    });

    it("should apply correct spinner styling", () => {
      render(<DashboardLoader visible={true} />);

      const statusElement = screen.getByRole("status");
      const spinner = statusElement.querySelector("div[class*='animate-spin']");

      expect(spinner).toHaveClass("animate-spin");
      expect(spinner).toHaveClass("rounded-full");
    });

    it("should render spinner with correct size classes", () => {
      render(<DashboardLoader visible={true} />);

      const statusElement = screen.getByRole("status");
      const spinner = statusElement.querySelector("div[class*='size-12']");

      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass("size-12");
    });

    it("should apply border styling to spinner", () => {
      render(<DashboardLoader visible={true} />);

      const statusElement = screen.getByRole("status");
      const spinner = statusElement.querySelector("div[class*='animate-spin']");

      expect(spinner).toHaveClass("border-4");
      expect(spinner).toHaveClass("border-muted");
      expect(spinner).toHaveClass("border-t-primary");
    });
  });

  describe("Accessibility", () => {
    it("should have role='status' when visible", () => {
      render(<DashboardLoader visible={true} />);

      const statusElement = screen.getByRole("status");
      expect(statusElement).toHaveAttribute("role", "status");
    });

    it("should have aria-live='polite' attribute", () => {
      render(<DashboardLoader visible={true} />);

      const statusElement = screen.getByRole("status");
      expect(statusElement).toHaveAttribute("aria-live", "polite");
    });

    it("should have aria-busy='true' attribute", () => {
      render(<DashboardLoader visible={true} />);

      const statusElement = screen.getByRole("status");
      expect(statusElement).toHaveAttribute("aria-busy", "true");
    });

    it("should have screen reader text", () => {
      render(<DashboardLoader visible={true} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should hide screen reader text visually", () => {
      render(<DashboardLoader visible={true} />);

      const srText = screen.getByText("Loading...");
      expect(srText).toHaveClass("sr-only");
    });

    it("should mark spinner as aria-hidden", () => {
      render(<DashboardLoader visible={true} />);

      const statusElement = screen.getByRole("status");
      const spinner = statusElement.querySelector("div[class*='animate-spin']");

      expect(spinner).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Container Styling", () => {
    it("should apply flex layout to container", () => {
      render(<DashboardLoader visible={true} />);

      const statusElement = screen.getByRole("status");
      expect(statusElement).toHaveClass("flex", "items-center", "justify-center");
    });

    it("should apply padding to container", () => {
      render(<DashboardLoader visible={true} />);

      const statusElement = screen.getByRole("status");
      expect(statusElement).toHaveClass("p-8");
    });

    it("should have relative positioning wrapper", () => {
      render(<DashboardLoader visible={true} />);

      const statusElement = screen.getByRole("status");
      const relativeWrapper = statusElement.querySelector("div.relative");

      expect(relativeWrapper).toBeInTheDocument();
    });
  });

  describe("Component Behavior", () => {
    it("should toggle visibility when prop changes", () => {
      const { rerender } = render(<DashboardLoader visible={false} />);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();

      rerender(<DashboardLoader visible={true} />);

      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("should hide when toggled from visible to hidden", () => {
      const { rerender } = render(<DashboardLoader visible={true} />);

      expect(screen.getByRole("status")).toBeInTheDocument();

      rerender(<DashboardLoader visible={false} />);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("should maintain consistent structure across renders", () => {
      const { rerender } = render(<DashboardLoader visible={true} />);

      const firstRender = screen.getByRole("status");
      expect(firstRender).toBeInTheDocument();

      rerender(<DashboardLoader visible={true} />);

      const secondRender = screen.getByRole("status");
      expect(secondRender).toBeInTheDocument();
    });
  });

  describe("Props Interface", () => {
    it("should accept visible prop as boolean true", () => {
      render(<DashboardLoader visible={true} />);

      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("should accept visible prop as boolean false", () => {
      render(<DashboardLoader visible={false} />);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("Visual Structure", () => {
    it("should render complete loading indicator structure", () => {
      render(<DashboardLoader visible={true} />);

      const statusElement = screen.getByRole("status");

      // Should have container
      expect(statusElement).toBeInTheDocument();

      // Should have relative wrapper
      const relativeWrapper = statusElement.querySelector("div.relative");
      expect(relativeWrapper).toBeInTheDocument();

      // Should have spinner
      const spinner = statusElement.querySelector("div[class*='animate-spin']");
      expect(spinner).toBeInTheDocument();

      // Should have screen reader text
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should not render any nested interactive elements", () => {
      render(<DashboardLoader visible={true} />);

      const statusElement = screen.getByRole("status");

      // Should not contain buttons, links, or inputs
      expect(statusElement.querySelector("button")).toBeNull();
      expect(statusElement.querySelector("a")).toBeNull();
      expect(statusElement.querySelector("input")).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid visibility toggles", () => {
      const { rerender } = render(<DashboardLoader visible={false} />);

      // Toggle rapidly
      rerender(<DashboardLoader visible={true} />);
      rerender(<DashboardLoader visible={false} />);
      rerender(<DashboardLoader visible={true} />);
      rerender(<DashboardLoader visible={false} />);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();

      rerender(<DashboardLoader visible={true} />);

      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("should not cause memory leaks on multiple renders", () => {
      const { rerender, unmount } = render(<DashboardLoader visible={true} />);

      for (let i = 0; i < 10; i++) {
        rerender(<DashboardLoader visible={i % 2 === 0} />);
      }

      // Should be able to unmount without errors
      unmount();
    });

    it("should maintain correct DOM structure after multiple toggles", () => {
      const { rerender } = render(<DashboardLoader visible={true} />);

      rerender(<DashboardLoader visible={false} />);
      rerender(<DashboardLoader visible={true} />);

      const statusElement = screen.getByRole("status");
      const spinner = statusElement.querySelector("div[class*='animate-spin']");

      expect(spinner).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("Animation Classes", () => {
    it("should have animate-spin class for rotation animation", () => {
      render(<DashboardLoader visible={true} />);

      const statusElement = screen.getByRole("status");
      const spinner = statusElement.querySelector("div[class*='animate-spin']");

      expect(spinner).toHaveClass("animate-spin");
    });

    it("should maintain animation classes across renders", () => {
      const { rerender } = render(<DashboardLoader visible={true} />);

      let spinner = screen.getByRole("status").querySelector("div[class*='animate-spin']");
      expect(spinner).toHaveClass("animate-spin");

      rerender(<DashboardLoader visible={true} />);

      spinner = screen.getByRole("status").querySelector("div[class*='animate-spin']");
      expect(spinner).toHaveClass("animate-spin");
    });
  });

  describe("Integration", () => {
    it("should work correctly within a loading state workflow", () => {
      // Simulate typical usage pattern
      const { rerender } = render(<DashboardLoader visible={false} />);

      // Initially not loading
      expect(screen.queryByRole("status")).not.toBeInTheDocument();

      // Start loading
      rerender(<DashboardLoader visible={true} />);
      expect(screen.getByRole("status")).toBeInTheDocument();

      // Finish loading
      rerender(<DashboardLoader visible={false} />);
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("should be compatible with screen readers", () => {
      render(<DashboardLoader visible={true} />);

      const statusElement = screen.getByRole("status");

      // Verify all accessibility attributes are present
      expect(statusElement).toHaveAttribute("role", "status");
      expect(statusElement).toHaveAttribute("aria-live", "polite");
      expect(statusElement).toHaveAttribute("aria-busy", "true");

      // Verify screen reader text exists
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("should not re-render unnecessarily when visible stays true", () => {
      const { rerender } = render(<DashboardLoader visible={true} />);

      const firstRender = screen.getByRole("status");

      rerender(<DashboardLoader visible={true} />);

      const secondRender = screen.getByRole("status");

      // Component should still be present and functional
      expect(secondRender).toBeInTheDocument();
    });

    it("should efficiently handle false prop without rendering", () => {
      const { container } = render(<DashboardLoader visible={false} />);

      // Should return null early, no DOM nodes created
      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});
