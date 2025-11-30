import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "../Pagination";

describe("Pagination", () => {
  describe("Pagination Logic (tested through component behavior)", () => {
    it("should show all pages for 5 pages", () => {
      render(<Pagination currentPage={3} totalPages={5} onPageChange={() => {}} />);

      expect(screen.getByLabelText("Go to page 1")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to page 2")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to page 3")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to page 4")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to page 5")).toBeInTheDocument();

      // Should not have ellipsis for 5 pages
      expect(screen.queryByText("...")).not.toBeInTheDocument();
    });

    it("should show ellipsis for large page counts", () => {
      render(<Pagination currentPage={5} totalPages={10} onPageChange={() => {}} />);

      // Should show ellipsis elements
      const ellipsisElements = screen.getAllByText("...");
      expect(ellipsisElements.length).toBeGreaterThan(0);
    });

    it("should show correct pages around current page in middle", () => {
      render(<Pagination currentPage={5} totalPages={10} onPageChange={() => {}} />);

      // Should show pages 4, 5, 6 around current page 5
      expect(screen.getByLabelText("Go to page 4")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to page 5")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to page 6")).toBeInTheDocument();
    });

    it("should show first and last pages with ellipsis in middle", () => {
      render(<Pagination currentPage={5} totalPages={10} onPageChange={() => {}} />);

      expect(screen.getByLabelText("Go to page 1")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to page 10")).toBeInTheDocument();
    });
  });

  describe("Pagination Component", () => {
    const mockOnPageChange = vi.fn();

    beforeEach(() => {
      mockOnPageChange.mockClear();
    });

    it("should not render when totalPages is 1", () => {
      const { container } = render(<Pagination currentPage={1} totalPages={1} onPageChange={mockOnPageChange} />);

      expect(container.firstChild).toBeNull();
    });

    it("should not render when totalPages is 0", () => {
      const { container } = render(<Pagination currentPage={1} totalPages={0} onPageChange={mockOnPageChange} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render Previous and Next buttons with correct pages", () => {
      render(<Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />);

      expect(screen.getByLabelText("Go to previous page")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to next page")).toBeInTheDocument();

      // Should show all pages 1-5
      expect(screen.getByLabelText("Go to page 1")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to page 2")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to page 3")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to page 4")).toBeInTheDocument();
      expect(screen.getByLabelText("Go to page 5")).toBeInTheDocument();
    });

    it("should disable Previous button on first page", () => {
      render(<Pagination currentPage={1} totalPages={3} onPageChange={mockOnPageChange} />);

      const previousButton = screen.getByLabelText("Go to previous page");
      expect(previousButton).toBeDisabled();
    });

    it("should disable Next button on last page", () => {
      render(<Pagination currentPage={3} totalPages={3} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByLabelText("Go to next page");
      expect(nextButton).toBeDisabled();
    });

    it("should call onPageChange when page button is clicked", async () => {
      const user = userEvent.setup();

      render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

      const page3Button = screen.getByLabelText("Go to page 3");
      await user.click(page3Button);

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it("should call onPageChange when Previous button is clicked", async () => {
      const user = userEvent.setup();

      render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      const previousButton = screen.getByLabelText("Go to previous page");
      await user.click(previousButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it("should call onPageChange when Next button is clicked", async () => {
      const user = userEvent.setup();

      render(<Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />);

      const nextButton = screen.getByLabelText("Go to next page");
      await user.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it("should mark current page as aria-current", () => {
      render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      const currentPageButton = screen.getByLabelText("Go to page 3");
      expect(currentPageButton).toHaveAttribute("aria-current", "page");
    });

    it("should disable current page button", () => {
      render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

      const currentPageButton = screen.getByLabelText("Go to page 3");
      expect(currentPageButton).toBeDisabled();
    });

    it("should render ellipsis correctly for large page counts", () => {
      render(<Pagination currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

      // Should show ellipsis spans
      const ellipsisElements = screen.getAllByText("...");
      expect(ellipsisElements).toHaveLength(2);

      // Should have aria-hidden on ellipsis
      ellipsisElements.forEach((ellipsis) => {
        expect(ellipsis).toHaveAttribute("aria-hidden", "true");
      });
    });

    it("should have proper accessibility attributes", () => {
      render(<Pagination currentPage={2} totalPages={5} onPageChange={mockOnPageChange} />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveAttribute("aria-label", "Pagination");
    });
  });
});
