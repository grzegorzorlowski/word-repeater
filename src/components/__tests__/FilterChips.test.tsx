import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterChips } from "../FilterChips";

describe("FilterChips", () => {
  const mockOnSourceFilterChange = vi.fn();
  const mockOnStatusFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Rendering", () => {
    it("should render all filter buttons", () => {
      render(
        <FilterChips
          sourceFilter=""
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      expect(screen.getByText("AI Generated")).toBeInTheDocument();
      expect(screen.getByText("Manual")).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });

    it("should have proper accessibility attributes", () => {
      render(
        <FilterChips
          sourceFilter=""
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      // Should have role="group" for filter groups
      const filterGroups = screen.getAllByRole("group");
      expect(filterGroups).toHaveLength(3); // Source filters, Status filters, and main group

      // Should have proper aria-labels
      expect(screen.getByLabelText("Flashcard filters")).toBeInTheDocument();
      expect(screen.getByLabelText("Source filters")).toBeInTheDocument();
      expect(screen.getByLabelText("Status filters")).toBeInTheDocument();
    });
  });

  describe("Source Filter Behavior", () => {
    it("should show AI Generated as not selected when sourceFilter is empty", () => {
      render(
        <FilterChips
          sourceFilter=""
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const aiButton = screen.getByLabelText("Filter by AI-generated flashcards");
      expect(aiButton).toHaveAttribute("aria-pressed", "false");
      // outline variant applies border class
      expect(aiButton).toHaveClass("border");
    });

    it("should show AI Generated as selected when sourceFilter is 'ai_generated'", () => {
      render(
        <FilterChips
          sourceFilter="ai_generated"
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const aiButton = screen.getByLabelText("Filter by AI-generated flashcards");
      expect(aiButton).toHaveAttribute("aria-pressed", "true");
      // default variant applies bg-primary class
      expect(aiButton).toHaveClass("bg-primary");
    });

    it("should show Manual as selected when sourceFilter is 'manual'", () => {
      render(
        <FilterChips
          sourceFilter="manual"
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const manualButton = screen.getByLabelText("Filter by manually created flashcards");
      expect(manualButton).toHaveAttribute("aria-pressed", "true");
    });

    it("should call onSourceFilterChange with 'ai_generated' when AI Generated button is clicked and currently empty", async () => {
      const user = userEvent.setup();

      render(
        <FilterChips
          sourceFilter=""
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const aiButton = screen.getByLabelText("Filter by AI-generated flashcards");
      await user.click(aiButton);

      expect(mockOnSourceFilterChange).toHaveBeenCalledWith("ai_generated");
    });

    it("should call onSourceFilterChange with empty string when AI Generated button is clicked and currently selected", async () => {
      const user = userEvent.setup();

      render(
        <FilterChips
          sourceFilter="ai_generated"
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const aiButton = screen.getByLabelText("Filter by AI-generated flashcards");
      await user.click(aiButton);

      expect(mockOnSourceFilterChange).toHaveBeenCalledWith("");
    });

    it("should switch from Manual to AI Generated when AI Generated is clicked", async () => {
      const user = userEvent.setup();

      render(
        <FilterChips
          sourceFilter="manual"
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const aiButton = screen.getByLabelText("Filter by AI-generated flashcards");
      await user.click(aiButton);

      expect(mockOnSourceFilterChange).toHaveBeenCalledWith("ai_generated");
    });
  });

  describe("Status Filter Behavior", () => {
    it("should show Active as not selected when statusFilter is empty", () => {
      render(
        <FilterChips
          sourceFilter=""
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const activeButton = screen.getByLabelText("Filter by active flashcards");
      expect(activeButton).toHaveAttribute("aria-pressed", "false");
    });

    it("should show Active as selected when statusFilter is 'active'", () => {
      render(
        <FilterChips
          sourceFilter=""
          statusFilter="active"
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const activeButton = screen.getByLabelText("Filter by active flashcards");
      expect(activeButton).toHaveAttribute("aria-pressed", "true");
    });

    it("should show Pending as selected when statusFilter is 'pending'", () => {
      render(
        <FilterChips
          sourceFilter=""
          statusFilter="pending"
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const pendingButton = screen.getByLabelText("Filter by pending flashcards");
      expect(pendingButton).toHaveAttribute("aria-pressed", "true");
    });

    it("should call onStatusFilterChange with 'active' when Active button is clicked and currently empty", async () => {
      const user = userEvent.setup();

      render(
        <FilterChips
          sourceFilter=""
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const activeButton = screen.getByLabelText("Filter by active flashcards");
      await user.click(activeButton);

      expect(mockOnStatusFilterChange).toHaveBeenCalledWith("active");
    });

    it("should call onStatusFilterChange with empty string when Active button is clicked and currently selected", async () => {
      const user = userEvent.setup();

      render(
        <FilterChips
          sourceFilter=""
          statusFilter="active"
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const activeButton = screen.getByLabelText("Filter by active flashcards");
      await user.click(activeButton);

      expect(mockOnStatusFilterChange).toHaveBeenCalledWith("");
    });

    it("should switch from Pending to Active when Active is clicked", async () => {
      const user = userEvent.setup();

      render(
        <FilterChips
          sourceFilter=""
          statusFilter="pending"
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const activeButton = screen.getByLabelText("Filter by active flashcards");
      await user.click(activeButton);

      expect(mockOnStatusFilterChange).toHaveBeenCalledWith("active");
    });
  });

  describe("Clear All Functionality", () => {
    it("should not show Clear All button when no filters are active", () => {
      render(
        <FilterChips
          sourceFilter=""
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      expect(screen.queryByText("Clear All")).not.toBeInTheDocument();
    });

    it("should show Clear All button when source filter is active", () => {
      render(
        <FilterChips
          sourceFilter="ai_generated"
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      expect(screen.getByLabelText("Clear all filters")).toBeInTheDocument();
    });

    it("should show Clear All button when status filter is active", () => {
      render(
        <FilterChips
          sourceFilter=""
          statusFilter="active"
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      expect(screen.getByLabelText("Clear all filters")).toBeInTheDocument();
    });

    it("should show Clear All button when both filters are active", () => {
      render(
        <FilterChips
          sourceFilter="manual"
          statusFilter="pending"
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      expect(screen.getByLabelText("Clear all filters")).toBeInTheDocument();
    });

    it("should call both filter change callbacks with empty strings when Clear All is clicked", async () => {
      const user = userEvent.setup();

      render(
        <FilterChips
          sourceFilter="ai_generated"
          statusFilter="active"
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const clearAllButton = screen.getByLabelText("Clear all filters");
      await user.click(clearAllButton);

      expect(mockOnSourceFilterChange).toHaveBeenCalledWith("");
      expect(mockOnStatusFilterChange).toHaveBeenCalledWith("");
    });
  });

  describe("Visual Layout", () => {
    it("should render divider between source and status filters", () => {
      const { container } = render(
        <FilterChips
          sourceFilter=""
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      // Should have divider elements with aria-hidden
      const dividers = container.querySelectorAll('[aria-hidden="true"].w-px.bg-border');
      expect(dividers.length).toBeGreaterThan(0);
    });

    it("should render filters in flex layout", () => {
      render(
        <FilterChips
          sourceFilter=""
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const container = screen.getByRole("group", { name: "Flashcard filters" });
      expect(container).toHaveClass("flex", "flex-wrap", "gap-2");
    });

    it("should render source filters in a group", () => {
      render(
        <FilterChips
          sourceFilter=""
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const sourceGroup = screen.getByRole("group", { name: "Source filters" });
      expect(sourceGroup).toHaveClass("flex", "gap-2");

      // Should contain AI Generated and Manual buttons
      expect(sourceGroup).toHaveTextContent("AI Generated");
      expect(sourceGroup).toHaveTextContent("Manual");
    });

    it("should render status filters in a group", () => {
      render(
        <FilterChips
          sourceFilter=""
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const statusGroup = screen.getByRole("group", { name: "Status filters" });
      expect(statusGroup).toHaveClass("flex", "gap-2");

      // Should contain Active and Pending buttons
      expect(statusGroup).toHaveTextContent("Active");
      expect(statusGroup).toHaveTextContent("Pending");
    });
  });

  describe("Button Variants", () => {
    it("should use outline variant for unselected buttons", () => {
      render(
        <FilterChips
          sourceFilter=""
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const buttons = screen.getAllByRole("button");
      // All buttons except Clear All should have border (outline variant)
      buttons.forEach((button) => {
        if (button.textContent !== "Clear All") {
          expect(button).toHaveClass("border");
        }
      });
    });

    it("should use default variant for selected buttons", () => {
      render(
        <FilterChips
          sourceFilter="ai_generated"
          statusFilter="active"
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const aiButton = screen.getByText("AI Generated");
      const activeButton = screen.getByText("Active");

      // default variant has bg-primary class
      expect(aiButton).toHaveClass("bg-primary");
      expect(activeButton).toHaveClass("bg-primary");
    });

    it("should use ghost variant for Clear All button", () => {
      render(
        <FilterChips
          sourceFilter="manual"
          statusFilter="pending"
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const clearAllButton = screen.getByText("Clear All");
      // ghost variant doesn't have border or bg-primary
      expect(clearAllButton).not.toHaveClass("border");
      expect(clearAllButton).not.toHaveClass("bg-primary");
    });
  });

  describe("Button Sizing", () => {
    it("should use small size for all filter buttons", () => {
      render(
        <FilterChips
          sourceFilter=""
          statusFilter=""
          onSourceFilterChange={mockOnSourceFilterChange}
          onStatusFilterChange={mockOnStatusFilterChange}
        />
      );

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        // sm size uses h-8 class
        expect(button).toHaveClass("h-8");
      });
    });
  });
});
